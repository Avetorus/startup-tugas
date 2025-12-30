import { useState } from "react";
import { DataTable, type Column } from "@/components/layout/DataTable";
import { StatusBadge } from "@/components/layout/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Clock, Users, UserCheck, UserX } from "lucide-react";
import { mockAttendance } from "@/lib/mockData";
import { exportToCSV } from "@/lib/export";
import { useQuery } from "@tanstack/react-query";
import { Employee } from "@shared/schema";
import { useCompany } from "@/contexts/CompanyContext";

// type Attendance = typeof mockAttendance[0];

export type Attendance = {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    hours: number;
    status: string;
}

export function AttendanceList() {
  const { activeCompany } = useCompany();
  const [attendance, setAttendance] = useState(mockAttendance); // change
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const presentCount = attendance.filter(a => a.status === "present").length;
  const onLeaveCount = attendance.filter(a => a.status === "on-leave").length;
  const totalHours = attendance.reduce((sum, a) => sum + a.hours, 0);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
      queryKey: ["/api/companies", activeCompany?.id, "employees"],
      enabled: !!activeCompany?.id,
  });

  const handleCheckIn = (attendanceId: string) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setAttendance(attendance.map(a => 
      a.id === attendanceId ? { ...a, checkIn: time, status: "present" } : a
    ));
    console.log("Checked in:", attendanceId, time);
  };

  const handleCheckOut = (attendanceId: string) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const record = attendance.find(a => a.id === attendanceId);
    if (record?.checkIn) {
      const checkInParts = record.checkIn.split(":");
      const checkInHour = parseInt(checkInParts[0]);
      const checkInMin = parseInt(checkInParts[1]);
      const hours = (now.getHours() - checkInHour) + (now.getMinutes() - checkInMin) / 60;
      setAttendance(attendance.map(a => 
        a.id === attendanceId
          ? {
              ...a,
              checkOut: time ?? "",
              checkIn: a.checkIn ?? "",
              hours: Math.round(hours * 100) / 100
            }
          : a
      ));
      console.log("Checked out:", attendanceId, time);
    }
  };

  const columns: Column<Attendance>[] = [
    { key: "employeeName", header: "Employee", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { 
      key: "checkIn", 
      header: "Check In",
      render: (item) => item.checkIn || "-"
    },
    { 
      key: "checkOut", 
      header: "Check Out",
      render: (item) => item.checkOut || "-"
    },
    { 
      key: "hours", 
      header: "Hours", 
      sortable: true,
      className: "text-right",
      render: (item) => item.hours > 0 ? `${item.hours}h` : "-"
    },
    { 
      key: "status", 
      header: "Status",
      render: (item) => <StatusBadge status={item.status as "present" | "on-leave" | "absent"} />
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (item) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {!item.checkIn && item.status !== "on-leave" && (
            <Button 
              size="sm" 
              onClick={() => handleCheckIn(item.id)}
              data-testid={`button-checkin-${item.id}`}
            >
              Check In
            </Button>
          )}
          {item.checkIn && !item.checkOut && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleCheckOut(item.id)}
              data-testid={`button-checkout-${item.id}`}
            >
              Check Out
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleExport = () => {
    if (attendance.length === 0) return;
    exportToCSV(
      attendance.map(a => ({
        employee: a.employeeName,
        date: a.date,
        checkIn: a.checkIn || "",
        checkOut: a.checkOut || "",
        hours: a.hours,
        status: a.status
      })),
      [
        { key: "employee", label: "Employee" },
        { key: "date", label: "Date" },
        { key: "checkIn", label: "Check In" },
        { key: "checkOut", label: "Check Out" },
        { key: "hours", label: "Hours" },
        { key: "status", label: "Status" }
      ],
      "attendance"
    );
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Track daily attendance"
        actions={
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={attendance.length}
          icon={Users}
        />
        <StatCard
          title="Present Today"
          value={presentCount}
          icon={UserCheck}
        />
        <StatCard
          title="On Leave"
          value={onLeaveCount}
          icon={UserX}
        />
        <StatCard
          title="Total Hours"
          value={`${totalHours.toFixed(1)}h`}
          icon={Clock}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="space-y-1">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
            data-testid="input-date"
          />
        </div>
      </div>

      <DataTable
        data={attendance}
        columns={columns}
        searchKey="employeeName"
        searchPlaceholder="Search employees..."
      />
    </div>
  );
}
