import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Clock,
  Calendar,
  DollarSign,
  Timer,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  mockAttendanceSummary,
  mockLeaveBalance,
  mockOvertimeSummary,
  mockPayrollByDepartment,
} from "@/lib/reportData";
import { cn } from "@/lib/utils";

export function HRReports() {
  const [activeTab, setActiveTab] = useState("attendance");

  const totalEmployees = mockAttendanceSummary.length;
  const avgAttendanceRate = (mockAttendanceSummary.reduce((sum, e) => sum + e.daysWorked, 0) / (totalEmployees * 22)) * 100;
  const totalOvertime = mockOvertimeSummary.reduce((sum, d) => sum + d.totalHours, 0);
  const totalPayroll = mockPayrollByDepartment.reduce((sum, d) => sum + d.netPayroll, 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card data-testid="card-total-employees">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold" data-testid="text-total-employees">{mockPayrollByDepartment.reduce((sum, d) => sum + d.employees, 0)}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-attendance-rate">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400" data-testid="text-attendance-rate">
              {avgAttendanceRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card data-testid="card-overtime">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Overtime (Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400" data-testid="text-overtime">
              {totalOvertime} hrs
            </p>
          </CardContent>
        </Card>
        <Card data-testid="card-payroll">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Monthly Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold" data-testid="text-payroll">${totalPayroll.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave" data-testid="tab-leave">Leave Balance</TabsTrigger>
          <TabsTrigger value="overtime" data-testid="tab-overtime">Overtime</TabsTrigger>
          <TabsTrigger value="payroll" data-testid="tab-payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance Summary
              </CardTitle>
              <CardDescription>Monthly attendance metrics by employee</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Days Worked</TableHead>
                    <TableHead className="text-center">Days Absent</TableHead>
                    <TableHead className="text-center">Late Arrivals</TableHead>
                    <TableHead className="text-center">Avg Hours</TableHead>
                    <TableHead className="text-center">Overtime</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAttendanceSummary.map((employee) => {
                    const attendanceRate = (employee.daysWorked / 22) * 100;
                    return (
                      <TableRow key={employee.employeeId}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell className="text-center">{employee.daysWorked}/22</TableCell>
                        <TableCell className={cn(
                          "text-center",
                          employee.daysAbsent > 2 && "text-red-600"
                        )}>
                          {employee.daysAbsent}
                        </TableCell>
                        <TableCell className={cn(
                          "text-center",
                          employee.lateArrivals > 3 && "text-amber-600"
                        )}>
                          {employee.lateArrivals}
                        </TableCell>
                        <TableCell className="text-center">{employee.avgHours}</TableCell>
                        <TableCell className="text-center">
                          {employee.overtimeHours > 0 && (
                            <Badge variant="secondary">{employee.overtimeHours} hrs</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {attendanceRate >= 95 ? (
                            <Badge className="bg-green-500">Excellent</Badge>
                          ) : attendanceRate >= 85 ? (
                            <Badge className="bg-blue-500">Good</Badge>
                          ) : (
                            <Badge className="bg-amber-500">Needs Review</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Balance Report
              </CardTitle>
              <CardDescription>Annual and sick leave balances by employee</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Annual Allowed</TableHead>
                    <TableHead className="text-center">Annual Used</TableHead>
                    <TableHead className="text-center">Annual Remaining</TableHead>
                    <TableHead className="text-center">Sick Used</TableHead>
                    <TableHead className="text-center">Sick Remaining</TableHead>
                    <TableHead className="text-center">Usage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLeaveBalance.map((employee) => {
                    const usagePercent = (employee.used / employee.annualAllowed) * 100;
                    return (
                      <TableRow key={employee.employeeId}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell className="text-center">{employee.annualAllowed}</TableCell>
                        <TableCell className="text-center">{employee.used}</TableCell>
                        <TableCell className={cn(
                          "text-center font-medium",
                          employee.remaining < 5 ? "text-amber-600" : "text-green-600"
                        )}>
                          {employee.remaining}
                        </TableCell>
                        <TableCell className="text-center">{employee.sickUsed}</TableCell>
                        <TableCell className="text-center">{employee.sickRemaining}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={usagePercent} className="h-2 w-16" />
                            <span className="text-sm">{usagePercent.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted/50 rounded-md">
                <h4 className="font-medium mb-3">Leave Summary</h4>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Annual Allowed</p>
                    <p className="text-xl font-semibold">{mockLeaveBalance.reduce((sum, e) => sum + e.annualAllowed, 0)} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Annual Used</p>
                    <p className="text-xl font-semibold">{mockLeaveBalance.reduce((sum, e) => sum + e.used, 0)} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Annual Remaining</p>
                    <p className="text-xl font-semibold text-green-600">{mockLeaveBalance.reduce((sum, e) => sum + e.remaining, 0)} days</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Sick Used</p>
                    <p className="text-xl font-semibold">{mockLeaveBalance.reduce((sum, e) => sum + e.sickUsed, 0)} days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Overtime Summary
              </CardTitle>
              <CardDescription>Monthly overtime hours and costs by department</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Employees</TableHead>
                    <TableHead className="text-center">Total Hours</TableHead>
                    <TableHead className="text-center">Avg per Employee</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOvertimeSummary.map((dept) => {
                    const maxHours = Math.max(...mockOvertimeSummary.map(d => d.totalHours));
                    return (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">{dept.department}</TableCell>
                        <TableCell className="text-center">{dept.employees}</TableCell>
                        <TableCell className="text-center font-medium">{dept.totalHours} hrs</TableCell>
                        <TableCell className="text-center">{dept.avgPerEmployee.toFixed(1)} hrs</TableCell>
                        <TableCell className="text-right">${dept.cost.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded-md overflow-hidden w-32">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${(dept.totalHours / maxHours) * 100}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Overtime Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{totalOvertime} hours</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Total Overtime Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-amber-600">
                      ${mockOvertimeSummary.reduce((sum, d) => sum + d.cost, 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Avg Overtime/Employee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">
                      {(totalOvertime / mockOvertimeSummary.reduce((sum, d) => sum + d.employees, 0)).toFixed(1)} hrs
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll Breakdown by Department
              </CardTitle>
              <CardDescription>Monthly payroll components and net amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Employees</TableHead>
                    <TableHead className="text-right">Base Salary</TableHead>
                    <TableHead className="text-right">Overtime</TableHead>
                    <TableHead className="text-right">Bonuses</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Payroll</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayrollByDepartment.map((dept) => (
                    <TableRow key={dept.department}>
                      <TableCell className="font-medium">{dept.department}</TableCell>
                      <TableCell className="text-center">{dept.employees}</TableCell>
                      <TableCell className="text-right">${dept.baseSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-amber-600">+${dept.overtime.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">+${dept.bonuses.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-600">-${dept.deductions.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">${dept.netPayroll.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-muted/50 rounded-md">
                <div className="grid md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Base</p>
                    <p className="text-xl font-semibold">
                      ${mockPayrollByDepartment.reduce((sum, d) => sum + d.baseSalary, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Overtime</p>
                    <p className="text-xl font-semibold text-amber-600">
                      +${mockPayrollByDepartment.reduce((sum, d) => sum + d.overtime, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Bonuses</p>
                    <p className="text-xl font-semibold text-green-600">
                      +${mockPayrollByDepartment.reduce((sum, d) => sum + d.bonuses, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Deductions</p>
                    <p className="text-xl font-semibold text-red-600">
                      -${mockPayrollByDepartment.reduce((sum, d) => sum + d.deductions, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Payroll</p>
                    <p className="text-xl font-semibold">
                      ${mockPayrollByDepartment.reduce((sum, d) => sum + d.netPayroll, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
