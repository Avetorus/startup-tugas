import { db } from "../db";
import { randomUUID } from "crypto";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  salesOrders, salesOrderLines, purchaseOrders, purchaseOrderLines, 
  products, warehouses, customers, vendors,
  stockLevels, stockMovements, stockReservations,
  deliveries, deliveryLines, goodsReceipts, goodsReceiptLines,
  invoices, invoiceLines, payments, paymentApplications,
  journalEntries, journalEntryLines, arApLedger, documentSequences,
  chartOfAccounts,
  type SalesOrder, type PurchaseOrder, type Product, type Warehouse,
  type StockLevel, type StockMovement, type StockReservation,
  type Delivery, type DeliveryLine, type GoodsReceipt, type GoodsReceiptLine,
  type Invoice, type InvoiceLine, type Payment, type PaymentApplication,
  type JournalEntry, type JournalEntryLine, type ArApLedger
} from "@shared/schema";

type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class WorkflowService {
  
  private async getNextDocumentNumberTx(tx: TxClient, companyId: string, documentType: string): Promise<string> {
    const [sequence] = await tx.select().from(documentSequences)
      .where(and(
        eq(documentSequences.companyId, companyId),
        eq(documentSequences.documentType, documentType)
      ))
      .for('update');

    if (!sequence) {
      const prefix = this.getDefaultPrefix(documentType);
      await tx.insert(documentSequences).values({
        id: randomUUID(),
        companyId,
        documentType,
        prefix,
        currentNumber: 1,
        numberLength: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return `${prefix}000001`;
    }

    const nextNumber = (sequence.currentNumber || 0) + 1;
    const paddedNumber = String(nextNumber).padStart(sequence.numberLength || 6, '0');
    
    await tx.update(documentSequences)
      .set({ currentNumber: nextNumber, updatedAt: new Date() })
      .where(eq(documentSequences.id, sequence.id));

    return `${sequence.prefix || ''}${paddedNumber}${sequence.suffix || ''}`;
  }

  async getNextDocumentNumber(companyId: string, documentType: string): Promise<string> {
    return await db.transaction(async (tx) => {
      return this.getNextDocumentNumberTx(tx, companyId, documentType);
    });
  }

  private getDefaultPrefix(documentType: string): string {
    const prefixes: Record<string, string> = {
      'SO': 'SO-', 'PO': 'PO-', 'INV': 'INV-', 'PAY': 'PAY-',
      'DEL': 'DEL-', 'GR': 'GR-', 'JE': 'JE-', 'SM': 'SM-'
    };
    return prefixes[documentType] || `${documentType}-`;
  }

  async confirmSalesOrder(salesOrderId: string, userId: string): Promise<{
    salesOrder: SalesOrder;
    reservations: StockReservation[];
  }> {
    return await db.transaction(async (tx) => {
      const [salesOrder] = await tx.select().from(salesOrders)
        .where(eq(salesOrders.id, salesOrderId))
        .for('update');

      if (!salesOrder) throw new Error("Sales order not found");
      if (salesOrder.status !== "draft") throw new Error("Sales order must be in draft status to confirm");

      const salesOrderLines = await this.getSalesOrderLinesTx(tx, salesOrderId);
      const reservations: StockReservation[] = [];

      for (const line of salesOrderLines) {
        const stockLevel = await this.getOrCreateStockLevelTx(
          tx,
          salesOrder.companyId,
          line.productId,
          salesOrder.warehouseId || ''
        );

        const availableQty = parseFloat(stockLevel.quantityAvailable || "0");
        const requestedQty = parseFloat(line.quantity || "0");

        if (availableQty < requestedQty) {
          throw new Error(`Insufficient stock for product. Available: ${availableQty}, Requested: ${requestedQty}`);
        }

        const reservationId = randomUUID();
        const [reservation] = await tx.insert(stockReservations).values({
          id: reservationId,
          companyId: salesOrder.companyId,
          salesOrderId: salesOrderId,
          salesOrderLineId: line.id,
          productId: line.productId,
          warehouseId: salesOrder.warehouseId || '',
          quantityReserved: String(requestedQty),
          quantityFulfilled: "0",
          status: "active",
          reservedAt: new Date(),
          createdBy: userId,
        }).returning();

        await tx.update(stockLevels)
          .set({
            quantityReserved: String(parseFloat(stockLevel.quantityReserved || "0") + requestedQty),
            quantityAvailable: String(availableQty - requestedQty),
            updatedAt: new Date(),
          })
          .where(eq(stockLevels.id, stockLevel.id));

        reservations.push(reservation);
      }

      const [updatedSalesOrder] = await tx.update(salesOrders)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(eq(salesOrders.id, salesOrderId))
        .returning();

      return { salesOrder: updatedSalesOrder, reservations };
    });
  }

  async createDeliveryFromSalesOrder(salesOrderId: string, userId: string): Promise<{
    delivery: Delivery;
    deliveryLines: DeliveryLine[];
    stockMovements: StockMovement[];
    journalEntry: JournalEntry | null;
  }> {
    return await db.transaction(async (tx) => {
      const [salesOrder] = await tx.select().from(salesOrders)
        .where(eq(salesOrders.id, salesOrderId))
        .for('update');

      if (!salesOrder) throw new Error("Sales order not found");
      if (salesOrder.status !== "confirmed") throw new Error("Sales order must be confirmed before delivery");

      const salesOrderLines = await this.getSalesOrderLinesTx(tx, salesOrderId);
      const deliveryNumber = await this.getNextDocumentNumberTx(tx, salesOrder.companyId, 'DEL');

      const [customer] = await tx.select().from(customers)
        .where(eq(customers.id, salesOrder.customerId));

      const deliveryId = randomUUID();
      const [delivery] = await tx.insert(deliveries).values({
        id: deliveryId,
        companyId: salesOrder.companyId,
        deliveryNumber,
        salesOrderId,
        customerId: salesOrder.customerId,
        warehouseId: salesOrder.warehouseId || '',
        deliveryDate: new Date(),
        status: "shipped",
        shippingAddress: customer?.address || '',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      const createdDeliveryLines: DeliveryLine[] = [];
      const createdStockMovements: StockMovement[] = [];
      let totalCOGS = 0;

      for (let i = 0; i < salesOrderLines.length; i++) {
        const line = salesOrderLines[i];
        const stockLevel = await this.getOrCreateStockLevelTx(
          tx,
          salesOrder.companyId,
          line.productId,
          salesOrder.warehouseId || ''
        );

        const quantity = parseFloat(line.quantity || "0");
        const unitCost = parseFloat(stockLevel.averageCost || "0");
        const totalCost = quantity * unitCost;
        totalCOGS += totalCost;

        const movementNumber = await this.getNextDocumentNumberTx(tx, salesOrder.companyId, 'SM');
        const movementId = randomUUID();
        const [stockMovement] = await tx.insert(stockMovements).values({
          id: movementId,
          companyId: salesOrder.companyId,
          movementNumber,
          productId: line.productId,
          warehouseId: salesOrder.warehouseId || '',
          movementType: "issue",
          movementDate: new Date(),
          quantity: String(-quantity),
          unitCost: String(unitCost),
          totalCost: String(totalCost),
          sourceDocument: "delivery",
          sourceDocumentId: deliveryId,
          sourceDocumentNumber: deliveryNumber,
          createdBy: userId,
          createdAt: new Date(),
        }).returning();

        createdStockMovements.push(stockMovement);

        await tx.update(stockLevels)
          .set({
            quantityOnHand: String(parseFloat(stockLevel.quantityOnHand || "0") - quantity),
            quantityReserved: String(Math.max(0, parseFloat(stockLevel.quantityReserved || "0") - quantity)),
            lastMovementDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(stockLevels.id, stockLevel.id));

        const deliveryLineId = randomUUID();
        const [deliveryLine] = await tx.insert(deliveryLines).values({
          id: deliveryLineId,
          deliveryId,
          lineNumber: i + 1,
          productId: line.productId,
          description: line.description,
          quantityOrdered: line.quantity,
          quantityDelivered: line.quantity,
          unitCost: String(unitCost),
          totalCost: String(totalCost),
          stockMovementId: movementId,
          createdAt: new Date(),
        }).returning();

        createdDeliveryLines.push(deliveryLine);

        const activeReservations = await tx.select().from(stockReservations)
          .where(and(
            eq(stockReservations.salesOrderId, salesOrderId),
            eq(stockReservations.salesOrderLineId, line.id),
            eq(stockReservations.status, "active")
          ))
          .for('update');

        let remainingToFulfill = quantity;
        for (const reservation of activeReservations) {
          if (remainingToFulfill <= 0) break;

          const reservedQty = parseFloat(reservation.quantityReserved || "0");
          const alreadyFulfilled = parseFloat(reservation.quantityFulfilled || "0");
          const availableToFulfill = reservedQty - alreadyFulfilled;

          if (availableToFulfill <= 0) continue;

          const fulfillAmount = Math.min(remainingToFulfill, availableToFulfill);
          const newFulfilledQty = alreadyFulfilled + fulfillAmount;
          const isFullyFulfilled = newFulfilledQty >= reservedQty;

          await tx.update(stockReservations)
            .set({
              quantityFulfilled: String(newFulfilledQty),
              status: isFullyFulfilled ? "fulfilled" : "active",
              fulfilledAt: isFullyFulfilled ? new Date() : null,
            })
            .where(eq(stockReservations.id, reservation.id));

          remainingToFulfill -= fulfillAmount;
        }
      }

      let journalEntry: JournalEntry | null = null;
      if (totalCOGS > 0) {
        journalEntry = await this.createCOGSJournalEntryTx(
          tx,
          salesOrder.companyId,
          deliveryId,
          deliveryNumber,
          totalCOGS,
          userId
        );

        await tx.update(deliveries)
          .set({ journalEntryId: journalEntry.id })
          .where(eq(deliveries.id, deliveryId));
      }

      await tx.update(salesOrders)
        .set({ status: "delivered", updatedAt: new Date() })
        .where(eq(salesOrders.id, salesOrderId));

      return { delivery, deliveryLines: createdDeliveryLines, stockMovements: createdStockMovements, journalEntry };
    });
  }

  async createInvoiceFromSalesOrder(salesOrderId: string, userId: string): Promise<{
    invoice: Invoice;
    invoiceLines: InvoiceLine[];
    journalEntry: JournalEntry;
    arLedgerEntry: ArApLedger;
  }> {
    return await db.transaction(async (tx) => {
      const [salesOrder] = await tx.select().from(salesOrders)
        .where(eq(salesOrders.id, salesOrderId))
        .for('update');

      if (!salesOrder) throw new Error("Sales order not found");
      if (salesOrder.status !== "delivered") throw new Error("Sales order must be delivered before invoicing");

      const [delivery] = await tx.select().from(deliveries)
        .where(eq(deliveries.salesOrderId, salesOrderId));

      const salesOrderLines = await this.getSalesOrderLinesTx(tx, salesOrderId);
      const invoiceNumber = await this.getNextDocumentNumberTx(tx, salesOrder.companyId, 'INV');

      const subtotal = parseFloat(salesOrder.subtotal || "0");
      const taxAmount = parseFloat(salesOrder.taxAmount || "0");
      const total = parseFloat(salesOrder.total || "0");

      const invoiceId = randomUUID();
      const [invoice] = await tx.insert(invoices).values({
        id: invoiceId,
        companyId: salesOrder.companyId,
        invoiceNumber,
        invoiceType: "customer",
        customerId: salesOrder.customerId,
        salesOrderId,
        deliveryId: delivery?.id,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        fiscalPeriodId: salesOrder.fiscalPeriodId,
        status: "posted",
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        total: String(total),
        amountPaid: "0",
        amountDue: String(total),
        currency: "IDR",
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      const createdInvoiceLines: InvoiceLine[] = [];
      for (let i = 0; i < salesOrderLines.length; i++) {
        const line = salesOrderLines[i];
        const invoiceLineId = randomUUID();
        const [invoiceLine] = await tx.insert(invoiceLines).values({
          id: invoiceLineId,
          invoiceId,
          lineNumber: i + 1,
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          createdAt: new Date(),
        }).returning();
        createdInvoiceLines.push(invoiceLine);
      }

      const journalEntry = await this.createARInvoiceJournalEntryTx(
        tx,
        salesOrder.companyId,
        invoiceId,
        invoiceNumber,
        total,
        taxAmount,
        userId
      );

      await tx.update(invoices)
        .set({ journalEntryId: journalEntry.id })
        .where(eq(invoices.id, invoiceId));

      const arLedgerEntry = await this.createARLedgerEntryTx(
        tx,
        salesOrder.companyId,
        salesOrder.customerId,
        invoiceId,
        invoiceNumber,
        total,
        journalEntry.id
      );

      await tx.update(salesOrders)
        .set({ status: "invoiced", updatedAt: new Date() })
        .where(eq(salesOrders.id, salesOrderId));

      return { invoice, invoiceLines: createdInvoiceLines, journalEntry, arLedgerEntry };
    });
  }

  async receivePayment(
    companyId: string,
    customerId: string,
    invoiceIds: string[],
    amount: number,
    paymentMethod: string,
    bankAccountId: string,
    userId: string
  ): Promise<{
    payment: Payment;
    applications: PaymentApplication[];
    journalEntry: JournalEntry;
    arLedgerEntry: ArApLedger;
  }> {
    return await db.transaction(async (tx) => {
      const paymentNumber = await this.getNextDocumentNumberTx(tx, companyId, 'PAY');
      const paymentId = randomUUID();

      const [payment] = await tx.insert(payments).values({
        id: paymentId,
        companyId,
        paymentNumber,
        paymentType: "receipt",
        customerId,
        paymentDate: new Date(),
        paymentMethod,
        bankAccountId,
        amount: String(amount),
        currency: "IDR",
        status: "posted",
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      const applications: PaymentApplication[] = [];
      let remainingAmount = amount;

      for (const invoiceId of invoiceIds) {
        if (remainingAmount <= 0) break;

        const [invoice] = await tx.select().from(invoices)
          .where(eq(invoices.id, invoiceId))
          .for('update');

        if (!invoice || invoice.companyId !== companyId) continue;

        const amountDue = parseFloat(invoice.amountDue || "0");
        const amountToApply = Math.min(remainingAmount, amountDue);

        if (amountToApply > 0) {
          const applicationId = randomUUID();
          const [application] = await tx.insert(paymentApplications).values({
            id: applicationId,
            paymentId,
            invoiceId,
            amountApplied: String(amountToApply),
            createdAt: new Date(),
          }).returning();
          applications.push(application);

          const newAmountPaid = parseFloat(invoice.amountPaid || "0") + amountToApply;
          const newAmountDue = amountDue - amountToApply;
          const newStatus = newAmountDue <= 0 ? "paid" : "partially_paid";

          await tx.update(invoices)
            .set({
              amountPaid: String(newAmountPaid),
              amountDue: String(newAmountDue),
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoiceId));

          remainingAmount -= amountToApply;
        }
      }

      const journalEntry = await this.createPaymentReceiptJournalEntryTx(
        tx,
        companyId,
        paymentId,
        paymentNumber,
        amount,
        bankAccountId,
        userId
      );

      await tx.update(payments)
        .set({ journalEntryId: journalEntry.id })
        .where(eq(payments.id, paymentId));

      const arLedgerEntry = await this.createARPaymentLedgerEntryTx(
        tx,
        companyId,
        customerId,
        paymentId,
        paymentNumber,
        amount,
        journalEntry.id
      );

      return { payment, applications, journalEntry, arLedgerEntry };
    });
  }

  async confirmPurchaseOrder(purchaseOrderId: string, userId: string): Promise<PurchaseOrder> {
    return await db.transaction(async (tx) => {
      const [purchaseOrder] = await tx.select().from(purchaseOrders)
        .where(eq(purchaseOrders.id, purchaseOrderId))
        .for('update');

      if (!purchaseOrder) throw new Error("Purchase order not found");
      if (purchaseOrder.status !== "draft") throw new Error("Purchase order must be in draft status to confirm");

      const purchaseOrderLines = await this.getPurchaseOrderLinesTx(tx, purchaseOrderId);

      for (const line of purchaseOrderLines) {
        const stockLevel = await this.getOrCreateStockLevelTx(
          tx,
          purchaseOrder.companyId,
          line.productId,
          purchaseOrder.warehouseId || ''
        );

        const quantity = parseFloat(line.quantity || "0");
        await tx.update(stockLevels)
          .set({
            quantityOnOrder: String(parseFloat(stockLevel.quantityOnOrder || "0") + quantity),
            updatedAt: new Date(),
          })
          .where(eq(stockLevels.id, stockLevel.id));
      }

      const [updatedPurchaseOrder] = await tx.update(purchaseOrders)
        .set({ status: "ordered", updatedAt: new Date() })
        .where(eq(purchaseOrders.id, purchaseOrderId))
        .returning();

      return updatedPurchaseOrder;
    });
  }

  async receiveGoodsFromPurchaseOrder(purchaseOrderId: string, userId: string): Promise<{
    goodsReceipt: GoodsReceipt;
    goodsReceiptLines: GoodsReceiptLine[];
    stockMovements: StockMovement[];
    journalEntry: JournalEntry;
  }> {
    return await db.transaction(async (tx) => {
      const [purchaseOrder] = await tx.select().from(purchaseOrders)
        .where(eq(purchaseOrders.id, purchaseOrderId))
        .for('update');

      if (!purchaseOrder) throw new Error("Purchase order not found");
      if (purchaseOrder.status !== "ordered") throw new Error("Purchase order must be in ordered status to receive");

      const purchaseOrderLines = await this.getPurchaseOrderLinesTx(tx, purchaseOrderId);
      const receiptNumber = await this.getNextDocumentNumberTx(tx, purchaseOrder.companyId, 'GR');

      const receiptId = randomUUID();
      const [goodsReceipt] = await tx.insert(goodsReceipts).values({
        id: receiptId,
        companyId: purchaseOrder.companyId,
        receiptNumber,
        purchaseOrderId,
        vendorId: purchaseOrder.vendorId,
        warehouseId: purchaseOrder.warehouseId || '',
        receiptDate: new Date(),
        status: "received",
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      const createdReceiptLines: GoodsReceiptLine[] = [];
      const createdStockMovements: StockMovement[] = [];
      let totalCost = 0;

      for (let i = 0; i < purchaseOrderLines.length; i++) {
        const line = purchaseOrderLines[i];
        const stockLevel = await this.getOrCreateStockLevelTx(
          tx,
          purchaseOrder.companyId,
          line.productId,
          purchaseOrder.warehouseId || ''
        );

        const quantity = parseFloat(line.quantity || "0");
        const unitCost = parseFloat(line.unitPrice || "0");
        const lineTotalCost = quantity * unitCost;
        totalCost += lineTotalCost;

        const currentQty = parseFloat(stockLevel.quantityOnHand || "0");
        const currentCost = parseFloat(stockLevel.averageCost || "0");
        const newTotalQty = currentQty + quantity;
        const newAvgCost = newTotalQty > 0 
          ? ((currentQty * currentCost) + lineTotalCost) / newTotalQty 
          : unitCost;

        const movementNumber = await this.getNextDocumentNumberTx(tx, purchaseOrder.companyId, 'SM');
        const movementId = randomUUID();
        const [stockMovement] = await tx.insert(stockMovements).values({
          id: movementId,
          companyId: purchaseOrder.companyId,
          movementNumber,
          productId: line.productId,
          warehouseId: purchaseOrder.warehouseId || '',
          movementType: "receipt",
          movementDate: new Date(),
          quantity: String(quantity),
          unitCost: String(unitCost),
          totalCost: String(lineTotalCost),
          sourceDocument: "goods_receipt",
          sourceDocumentId: receiptId,
          sourceDocumentNumber: receiptNumber,
          createdBy: userId,
          createdAt: new Date(),
        }).returning();

        createdStockMovements.push(stockMovement);

        await tx.update(stockLevels)
          .set({
            quantityOnHand: String(newTotalQty),
            quantityAvailable: String(newTotalQty - parseFloat(stockLevel.quantityReserved || "0")),
            quantityOnOrder: String(Math.max(0, parseFloat(stockLevel.quantityOnOrder || "0") - quantity)),
            averageCost: String(newAvgCost),
            lastMovementDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(stockLevels.id, stockLevel.id));

        const receiptLineId = randomUUID();
        const [receiptLine] = await tx.insert(goodsReceiptLines).values({
          id: receiptLineId,
          goodsReceiptId: receiptId,
          lineNumber: i + 1,
          productId: line.productId,
          description: line.description,
          quantityOrdered: line.quantity,
          quantityReceived: line.quantity,
          unitCost: String(unitCost),
          totalCost: String(lineTotalCost),
          stockMovementId: movementId,
          createdAt: new Date(),
        }).returning();

        createdReceiptLines.push(receiptLine);
      }

      const journalEntry = await this.createGoodsReceiptJournalEntryTx(
        tx,
        purchaseOrder.companyId,
        receiptId,
        receiptNumber,
        totalCost,
        userId
      );

      await tx.update(goodsReceipts)
        .set({ journalEntryId: journalEntry.id })
        .where(eq(goodsReceipts.id, receiptId));

      await tx.update(purchaseOrders)
        .set({ status: "received", updatedAt: new Date() })
        .where(eq(purchaseOrders.id, purchaseOrderId));

      return { goodsReceipt, goodsReceiptLines: createdReceiptLines, stockMovements: createdStockMovements, journalEntry };
    });
  }

  async createVendorInvoice(purchaseOrderId: string, userId: string): Promise<{
    invoice: Invoice;
    invoiceLines: InvoiceLine[];
    journalEntry: JournalEntry;
    apLedgerEntry: ArApLedger;
  }> {
    return await db.transaction(async (tx) => {
      const [purchaseOrder] = await tx.select().from(purchaseOrders)
        .where(eq(purchaseOrders.id, purchaseOrderId))
        .for('update');

      if (!purchaseOrder) throw new Error("Purchase order not found");
      if (purchaseOrder.status !== "received") throw new Error("Purchase order must be received before billing");

      const [goodsReceipt] = await tx.select().from(goodsReceipts)
        .where(eq(goodsReceipts.purchaseOrderId, purchaseOrderId));

      const purchaseOrderLines = await this.getPurchaseOrderLinesTx(tx, purchaseOrderId);
      const invoiceNumber = await this.getNextDocumentNumberTx(tx, purchaseOrder.companyId, 'INV');

      const subtotal = parseFloat(purchaseOrder.subtotal || "0");
      const taxAmount = parseFloat(purchaseOrder.taxAmount || "0");
      const total = parseFloat(purchaseOrder.total || "0");

      const invoiceId = randomUUID();
      const [invoice] = await tx.insert(invoices).values({
        id: invoiceId,
        companyId: purchaseOrder.companyId,
        invoiceNumber,
        invoiceType: "vendor",
        vendorId: purchaseOrder.vendorId,
        purchaseOrderId,
        goodsReceiptId: goodsReceipt?.id,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        fiscalPeriodId: purchaseOrder.fiscalPeriodId,
        status: "posted",
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        total: String(total),
        amountPaid: "0",
        amountDue: String(total),
        currency: "IDR",
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      const createdInvoiceLines: InvoiceLine[] = [];
      for (let i = 0; i < purchaseOrderLines.length; i++) {
        const line = purchaseOrderLines[i];
        const invoiceLineId = randomUUID();
        const [invoiceLine] = await tx.insert(invoiceLines).values({
          id: invoiceLineId,
          invoiceId,
          lineNumber: i + 1,
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          createdAt: new Date(),
        }).returning();
        createdInvoiceLines.push(invoiceLine);
      }

      const journalEntry = await this.createAPInvoiceJournalEntryTx(
        tx,
        purchaseOrder.companyId,
        invoiceId,
        invoiceNumber,
        total,
        taxAmount,
        userId
      );

      await tx.update(invoices)
        .set({ journalEntryId: journalEntry.id })
        .where(eq(invoices.id, invoiceId));

      const apLedgerEntry = await this.createAPLedgerEntryTx(
        tx,
        purchaseOrder.companyId,
        purchaseOrder.vendorId,
        invoiceId,
        invoiceNumber,
        total,
        journalEntry.id
      );

      await tx.update(purchaseOrders)
        .set({ status: "billed", updatedAt: new Date() })
        .where(eq(purchaseOrders.id, purchaseOrderId));

      return { invoice, invoiceLines: createdInvoiceLines, journalEntry, apLedgerEntry };
    });
  }

  async makeVendorPayment(
    companyId: string,
    vendorId: string,
    invoiceIds: string[],
    amount: number,
    paymentMethod: string,
    bankAccountId: string,
    userId: string
  ): Promise<{
    payment: Payment;
    applications: PaymentApplication[];
    journalEntry: JournalEntry;
    apLedgerEntry: ArApLedger;
  }> {
    return await db.transaction(async (tx) => {
      const paymentNumber = await this.getNextDocumentNumberTx(tx, companyId, 'PAY');
      const paymentId = randomUUID();

      const [payment] = await tx.insert(payments).values({
        id: paymentId,
        companyId,
        paymentNumber,
        paymentType: "payment",
        vendorId,
        paymentDate: new Date(),
        paymentMethod,
        bankAccountId,
        amount: String(amount),
        currency: "IDR",
        status: "posted",
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      const applications: PaymentApplication[] = [];
      let remainingAmount = amount;

      for (const invoiceId of invoiceIds) {
        if (remainingAmount <= 0) break;

        const [invoice] = await tx.select().from(invoices)
          .where(eq(invoices.id, invoiceId))
          .for('update');

        if (!invoice || invoice.companyId !== companyId) continue;

        const amountDue = parseFloat(invoice.amountDue || "0");
        const amountToApply = Math.min(remainingAmount, amountDue);

        if (amountToApply > 0) {
          const applicationId = randomUUID();
          const [application] = await tx.insert(paymentApplications).values({
            id: applicationId,
            paymentId,
            invoiceId,
            amountApplied: String(amountToApply),
            createdAt: new Date(),
          }).returning();
          applications.push(application);

          const newAmountPaid = parseFloat(invoice.amountPaid || "0") + amountToApply;
          const newAmountDue = amountDue - amountToApply;
          const newStatus = newAmountDue <= 0 ? "paid" : "partially_paid";

          await tx.update(invoices)
            .set({
              amountPaid: String(newAmountPaid),
              amountDue: String(newAmountDue),
              status: newStatus,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoiceId));

          remainingAmount -= amountToApply;
        }
      }

      const journalEntry = await this.createVendorPaymentJournalEntryTx(
        tx,
        companyId,
        paymentId,
        paymentNumber,
        amount,
        bankAccountId,
        userId
      );

      await tx.update(payments)
        .set({ journalEntryId: journalEntry.id })
        .where(eq(payments.id, paymentId));

      const apLedgerEntry = await this.createAPPaymentLedgerEntryTx(
        tx,
        companyId,
        vendorId,
        paymentId,
        paymentNumber,
        amount,
        journalEntry.id
      );

      return { payment, applications, journalEntry, apLedgerEntry };
    });
  }

  private async getSalesOrderLines(salesOrderId: string): Promise<any[]> {
    return [];
  }

  private async getPurchaseOrderLines(purchaseOrderId: string): Promise<any[]> {
    return [];
  }

  private async getOrCreateStockLevel(companyId: string, productId: string, warehouseId: string): Promise<StockLevel> {
    const [existing] = await db.select().from(stockLevels)
      .where(and(
        eq(stockLevels.companyId, companyId),
        eq(stockLevels.productId, productId),
        eq(stockLevels.warehouseId, warehouseId)
      ));

    if (existing) return existing;

    const [created] = await db.insert(stockLevels).values({
      id: randomUUID(),
      companyId,
      productId,
      warehouseId,
      quantityOnHand: "0",
      quantityReserved: "0",
      quantityAvailable: "0",
      quantityOnOrder: "0",
      averageCost: "0",
      updatedAt: new Date(),
    }).returning();

    return created;
  }

  private async getAccountByCode(companyId: string, accountCode: string): Promise<string | null> {
    const [account] = await db.select().from(chartOfAccounts)
      .where(and(
        eq(chartOfAccounts.companyId, companyId),
        eq(chartOfAccounts.accountCode, accountCode)
      ));
    return account?.id || null;
  }

  private async createCOGSJournalEntry(
    companyId: string,
    deliveryId: string,
    deliveryNumber: string,
    totalCOGS: number,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumber(companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await db.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `COGS for delivery ${deliveryNumber}`,
      reference: deliveryNumber,
      sourceDocument: "delivery",
      sourceDocumentId: deliveryId,
      status: "posted",
      totalDebit: String(totalCOGS),
      totalCredit: String(totalCOGS),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const cogsAccountId = await this.getAccountByCode(companyId, "5100") || "";
    const inventoryAccountId = await this.getAccountByCode(companyId, "1200") || "";

    await db.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: cogsAccountId,
        description: "Cost of goods sold",
        debit: String(totalCOGS),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: inventoryAccountId,
        description: "Inventory reduction",
        debit: "0",
        credit: String(totalCOGS),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createARInvoiceJournalEntry(
    companyId: string,
    invoiceId: string,
    invoiceNumber: string,
    total: number,
    taxAmount: number,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumber(companyId, 'JE');
    const entryId = randomUUID();
    const netAmount = total - taxAmount;

    const [entry] = await db.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Customer invoice ${invoiceNumber}`,
      reference: invoiceNumber,
      sourceDocument: "invoice",
      sourceDocumentId: invoiceId,
      status: "posted",
      totalDebit: String(total),
      totalCredit: String(total),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const arAccountId = await this.getAccountByCode(companyId, "1200") || "";
    const revenueAccountId = await this.getAccountByCode(companyId, "4100") || "";

    await db.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: arAccountId,
        description: "Accounts Receivable",
        debit: String(total),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: revenueAccountId,
        description: "Sales Revenue",
        debit: "0",
        credit: String(netAmount),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createPaymentReceiptJournalEntry(
    companyId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    bankAccountId: string,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumber(companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await db.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Payment receipt ${paymentNumber}`,
      reference: paymentNumber,
      sourceDocument: "payment",
      sourceDocumentId: paymentId,
      status: "posted",
      totalDebit: String(amount),
      totalCredit: String(amount),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const cashAccountId = bankAccountId || await this.getAccountByCode(companyId, "1100") || "";
    const arAccountId = await this.getAccountByCode(companyId, "1200") || "";

    await db.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: cashAccountId,
        description: "Cash/Bank",
        debit: String(amount),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: arAccountId,
        description: "Accounts Receivable",
        debit: "0",
        credit: String(amount),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createGoodsReceiptJournalEntry(
    companyId: string,
    receiptId: string,
    receiptNumber: string,
    totalCost: number,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumber(companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await db.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Goods receipt ${receiptNumber}`,
      reference: receiptNumber,
      sourceDocument: "goods_receipt",
      sourceDocumentId: receiptId,
      status: "posted",
      totalDebit: String(totalCost),
      totalCredit: String(totalCost),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const inventoryAccountId = await this.getAccountByCode(companyId, "1200") || "";
    const grniAccountId = await this.getAccountByCode(companyId, "2100") || "";

    await db.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: inventoryAccountId,
        description: "Inventory",
        debit: String(totalCost),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: grniAccountId,
        description: "GRNI - Goods Received Not Invoiced",
        debit: "0",
        credit: String(totalCost),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createAPInvoiceJournalEntry(
    companyId: string,
    invoiceId: string,
    invoiceNumber: string,
    total: number,
    taxAmount: number,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumber(companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await db.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Vendor invoice ${invoiceNumber}`,
      reference: invoiceNumber,
      sourceDocument: "invoice",
      sourceDocumentId: invoiceId,
      status: "posted",
      totalDebit: String(total),
      totalCredit: String(total),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const grniAccountId = await this.getAccountByCode(companyId, "2100") || "";
    const apAccountId = await this.getAccountByCode(companyId, "2100") || "";

    await db.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: grniAccountId,
        description: "GRNI - Clear accrual",
        debit: String(total),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: apAccountId,
        description: "Accounts Payable",
        debit: "0",
        credit: String(total),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createVendorPaymentJournalEntry(
    companyId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    bankAccountId: string,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumber(companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await db.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Vendor payment ${paymentNumber}`,
      reference: paymentNumber,
      sourceDocument: "payment",
      sourceDocumentId: paymentId,
      status: "posted",
      totalDebit: String(amount),
      totalCredit: String(amount),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const apAccountId = await this.getAccountByCode(companyId, "2100") || "";
    const cashAccountId = bankAccountId || await this.getAccountByCode(companyId, "1100") || "";

    await db.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: apAccountId,
        description: "Accounts Payable",
        debit: String(amount),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: cashAccountId,
        description: "Cash/Bank",
        debit: "0",
        credit: String(amount),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createARLedgerEntry(
    companyId: string,
    customerId: string,
    invoiceId: string,
    invoiceNumber: string,
    amount: number,
    journalEntryId: string
  ): Promise<ArApLedger> {
    const [entry] = await db.insert(arApLedger).values({
      id: randomUUID(),
      companyId,
      ledgerType: "AR",
      customerId,
      transactionDate: new Date(),
      transactionType: "invoice",
      documentId: invoiceId,
      documentNumber: invoiceNumber,
      description: `Customer invoice ${invoiceNumber}`,
      debitAmount: String(amount),
      creditAmount: "0",
      runningBalance: String(amount),
      currency: "IDR",
      journalEntryId,
      createdAt: new Date(),
    }).returning();

    return entry;
  }

  private async createARPaymentLedgerEntry(
    companyId: string,
    customerId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    journalEntryId: string
  ): Promise<ArApLedger> {
    const [entry] = await db.insert(arApLedger).values({
      id: randomUUID(),
      companyId,
      ledgerType: "AR",
      customerId,
      transactionDate: new Date(),
      transactionType: "payment",
      documentId: paymentId,
      documentNumber: paymentNumber,
      description: `Payment receipt ${paymentNumber}`,
      debitAmount: "0",
      creditAmount: String(amount),
      runningBalance: String(-amount),
      currency: "IDR",
      journalEntryId,
      createdAt: new Date(),
    }).returning();

    return entry;
  }

  private async createAPLedgerEntry(
    companyId: string,
    vendorId: string,
    invoiceId: string,
    invoiceNumber: string,
    amount: number,
    journalEntryId: string
  ): Promise<ArApLedger> {
    const [entry] = await db.insert(arApLedger).values({
      id: randomUUID(),
      companyId,
      ledgerType: "AP",
      vendorId,
      transactionDate: new Date(),
      transactionType: "invoice",
      documentId: invoiceId,
      documentNumber: invoiceNumber,
      description: `Vendor invoice ${invoiceNumber}`,
      debitAmount: "0",
      creditAmount: String(amount),
      runningBalance: String(amount),
      currency: "IDR",
      journalEntryId,
      createdAt: new Date(),
    }).returning();

    return entry;
  }

  private async createAPPaymentLedgerEntry(
    companyId: string,
    vendorId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    journalEntryId: string
  ): Promise<ArApLedger> {
    const [entry] = await db.insert(arApLedger).values({
      id: randomUUID(),
      companyId,
      ledgerType: "AP",
      vendorId,
      transactionDate: new Date(),
      transactionType: "payment",
      documentId: paymentId,
      documentNumber: paymentNumber,
      description: `Vendor payment ${paymentNumber}`,
      debitAmount: String(amount),
      creditAmount: "0",
      runningBalance: String(-amount),
      currency: "IDR",
      journalEntryId,
      createdAt: new Date(),
    }).returning();

    return entry;
  }

  private async getSalesOrderLinesTx(tx: TxClient, salesOrderId: string): Promise<typeof salesOrderLines.$inferSelect[]> {
    return await tx.select().from(salesOrderLines)
      .where(eq(salesOrderLines.salesOrderId, salesOrderId))
      .for('update');
  }

  private async getPurchaseOrderLinesTx(tx: TxClient, purchaseOrderId: string): Promise<typeof purchaseOrderLines.$inferSelect[]> {
    return await tx.select().from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.purchaseOrderId, purchaseOrderId))
      .for('update');
  }

  private async getOrCreateStockLevelTx(tx: TxClient, companyId: string, productId: string, warehouseId: string): Promise<StockLevel> {
    const [existing] = await tx.select().from(stockLevels)
      .where(and(
        eq(stockLevels.companyId, companyId),
        eq(stockLevels.productId, productId),
        eq(stockLevels.warehouseId, warehouseId)
      ))
      .for('update');

    if (existing) return existing;

    const [created] = await tx.insert(stockLevels).values({
      id: randomUUID(),
      companyId,
      productId,
      warehouseId,
      quantityOnHand: "0",
      quantityReserved: "0",
      quantityAvailable: "0",
      quantityOnOrder: "0",
      averageCost: "0",
      updatedAt: new Date(),
    }).returning();

    return created;
  }

  private async getAccountByCodeTx(tx: TxClient, companyId: string, accountCode: string): Promise<string | null> {
    const [account] = await tx.select().from(chartOfAccounts)
      .where(and(
        eq(chartOfAccounts.companyId, companyId),
        eq(chartOfAccounts.accountCode, accountCode)
      ));
    return account?.id || null;
  }

  private async createCOGSJournalEntryTx(
    tx: TxClient,
    companyId: string,
    deliveryId: string,
    deliveryNumber: string,
    totalCOGS: number,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumberTx(tx, companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await tx.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `COGS for delivery ${deliveryNumber}`,
      reference: deliveryNumber,
      sourceDocument: "delivery",
      sourceDocumentId: deliveryId,
      status: "posted",
      totalDebit: String(totalCOGS),
      totalCredit: String(totalCOGS),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const cogsAccountId = await this.getAccountByCodeTx(tx, companyId, "5100") || "";
    const inventoryAccountId = await this.getAccountByCodeTx(tx, companyId, "1200") || "";

    await tx.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: cogsAccountId,
        description: "Cost of goods sold",
        debit: String(totalCOGS),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: inventoryAccountId,
        description: "Inventory reduction",
        debit: "0",
        credit: String(totalCOGS),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createARInvoiceJournalEntryTx(
    tx: TxClient,
    companyId: string,
    invoiceId: string,
    invoiceNumber: string,
    total: number,
    taxAmount: number,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumberTx(tx, companyId, 'JE');
    const entryId = randomUUID();
    const netAmount = total - taxAmount;

    const [entry] = await tx.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Customer invoice ${invoiceNumber}`,
      reference: invoiceNumber,
      sourceDocument: "invoice",
      sourceDocumentId: invoiceId,
      status: "posted",
      totalDebit: String(total),
      totalCredit: String(total),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const arAccountId = await this.getAccountByCodeTx(tx, companyId, "1200") || "";
    const revenueAccountId = await this.getAccountByCodeTx(tx, companyId, "4100") || "";

    await tx.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: arAccountId,
        description: "Accounts Receivable",
        debit: String(total),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: revenueAccountId,
        description: "Sales Revenue",
        debit: "0",
        credit: String(netAmount),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createARLedgerEntryTx(
    tx: TxClient,
    companyId: string,
    customerId: string,
    invoiceId: string,
    invoiceNumber: string,
    amount: number,
    journalEntryId: string
  ): Promise<ArApLedger> {
    const [entry] = await tx.insert(arApLedger).values({
      id: randomUUID(),
      companyId,
      ledgerType: "AR",
      customerId,
      transactionDate: new Date(),
      transactionType: "invoice",
      documentId: invoiceId,
      documentNumber: invoiceNumber,
      description: `Customer invoice ${invoiceNumber}`,
      debitAmount: String(amount),
      creditAmount: "0",
      runningBalance: String(amount),
      currency: "IDR",
      journalEntryId,
      createdAt: new Date(),
    }).returning();

    return entry;
  }

  private async createPaymentReceiptJournalEntryTx(
    tx: TxClient,
    companyId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    bankAccountId: string,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumberTx(tx, companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await tx.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Payment receipt ${paymentNumber}`,
      reference: paymentNumber,
      sourceDocument: "payment",
      sourceDocumentId: paymentId,
      status: "posted",
      totalDebit: String(amount),
      totalCredit: String(amount),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const cashAccountId = bankAccountId || await this.getAccountByCodeTx(tx, companyId, "1100") || "";
    const arAccountId = await this.getAccountByCodeTx(tx, companyId, "1200") || "";

    await tx.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: cashAccountId,
        description: "Cash/Bank",
        debit: String(amount),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: arAccountId,
        description: "Accounts Receivable",
        debit: "0",
        credit: String(amount),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createARPaymentLedgerEntryTx(
    tx: TxClient,
    companyId: string,
    customerId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    journalEntryId: string
  ): Promise<ArApLedger> {
    const [entry] = await tx.insert(arApLedger).values({
      id: randomUUID(),
      companyId,
      ledgerType: "AR",
      customerId,
      transactionDate: new Date(),
      transactionType: "payment",
      documentId: paymentId,
      documentNumber: paymentNumber,
      description: `Payment receipt ${paymentNumber}`,
      debitAmount: "0",
      creditAmount: String(amount),
      runningBalance: String(-amount),
      currency: "IDR",
      journalEntryId,
      createdAt: new Date(),
    }).returning();

    return entry;
  }

  private async createGoodsReceiptJournalEntryTx(
    tx: TxClient,
    companyId: string,
    receiptId: string,
    receiptNumber: string,
    totalCost: number,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumberTx(tx, companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await tx.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Goods receipt ${receiptNumber}`,
      reference: receiptNumber,
      sourceDocument: "goods_receipt",
      sourceDocumentId: receiptId,
      status: "posted",
      totalDebit: String(totalCost),
      totalCredit: String(totalCost),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const inventoryAccountId = await this.getAccountByCodeTx(tx, companyId, "1200") || "";
    const grniAccountId = await this.getAccountByCodeTx(tx, companyId, "2100") || "";

    await tx.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: inventoryAccountId,
        description: "Inventory",
        debit: String(totalCost),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: grniAccountId,
        description: "GRNI - Goods Received Not Invoiced",
        debit: "0",
        credit: String(totalCost),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createAPInvoiceJournalEntryTx(
    tx: TxClient,
    companyId: string,
    invoiceId: string,
    invoiceNumber: string,
    total: number,
    taxAmount: number,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumberTx(tx, companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await tx.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Vendor invoice ${invoiceNumber}`,
      reference: invoiceNumber,
      sourceDocument: "invoice",
      sourceDocumentId: invoiceId,
      status: "posted",
      totalDebit: String(total),
      totalCredit: String(total),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const grniAccountId = await this.getAccountByCodeTx(tx, companyId, "2100") || "";
    const apAccountId = await this.getAccountByCodeTx(tx, companyId, "2100") || "";

    await tx.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: grniAccountId,
        description: "GRNI - Clear accrual",
        debit: String(total),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: apAccountId,
        description: "Accounts Payable",
        debit: "0",
        credit: String(total),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createAPLedgerEntryTx(
    tx: TxClient,
    companyId: string,
    vendorId: string,
    invoiceId: string,
    invoiceNumber: string,
    amount: number,
    journalEntryId: string
  ): Promise<ArApLedger> {
    const [entry] = await tx.insert(arApLedger).values({
      id: randomUUID(),
      companyId,
      ledgerType: "AP",
      vendorId,
      transactionDate: new Date(),
      transactionType: "invoice",
      documentId: invoiceId,
      documentNumber: invoiceNumber,
      description: `Vendor invoice ${invoiceNumber}`,
      debitAmount: "0",
      creditAmount: String(amount),
      runningBalance: String(amount),
      currency: "IDR",
      journalEntryId,
      createdAt: new Date(),
    }).returning();

    return entry;
  }

  private async createVendorPaymentJournalEntryTx(
    tx: TxClient,
    companyId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    bankAccountId: string,
    userId: string
  ): Promise<JournalEntry> {
    const entryNumber = await this.getNextDocumentNumberTx(tx, companyId, 'JE');
    const entryId = randomUUID();

    const [entry] = await tx.insert(journalEntries).values({
      id: entryId,
      companyId,
      entryNumber,
      entryDate: new Date(),
      description: `Vendor payment ${paymentNumber}`,
      reference: paymentNumber,
      sourceDocument: "payment",
      sourceDocumentId: paymentId,
      status: "posted",
      totalDebit: String(amount),
      totalCredit: String(amount),
      postedBy: userId,
      postedAt: new Date(),
      createdBy: userId,
      createdAt: new Date(),
    }).returning();

    const apAccountId = await this.getAccountByCodeTx(tx, companyId, "2100") || "";
    const cashAccountId = bankAccountId || await this.getAccountByCodeTx(tx, companyId, "1100") || "";

    await tx.insert(journalEntryLines).values([
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 1,
        accountId: apAccountId,
        description: "Accounts Payable",
        debit: String(amount),
        credit: "0",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        journalEntryId: entryId,
        lineNumber: 2,
        accountId: cashAccountId,
        description: "Cash/Bank",
        debit: "0",
        credit: String(amount),
        createdAt: new Date(),
      }
    ]);

    return entry;
  }

  private async createAPPaymentLedgerEntryTx(
    tx: TxClient,
    companyId: string,
    vendorId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    journalEntryId: string
  ): Promise<ArApLedger> {
    const [entry] = await tx.insert(arApLedger).values({
      id: randomUUID(),
      companyId,
      ledgerType: "AP",
      vendorId,
      transactionDate: new Date(),
      transactionType: "payment",
      documentId: paymentId,
      documentNumber: paymentNumber,
      description: `Vendor payment ${paymentNumber}`,
      debitAmount: String(amount),
      creditAmount: "0",
      runningBalance: String(-amount),
      currency: "IDR",
      journalEntryId,
      createdAt: new Date(),
    }).returning();

    return entry;
  }
}

export const workflowService = new WorkflowService();
