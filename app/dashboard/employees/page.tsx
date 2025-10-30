"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

// Mock employee data as fallback
const mockEmployees = [
  {
    id: 1,
    name: "Marco Rossi",
    email: "marco.rossi@reuters.com",
    phone: "+39 02 1234 5678",
    role: "Senior Editor",
    bureau: "Milan",
    status: "active",
    shiftsThisMonth: 18,
    initials: "MR",
  },
  {
    id: 2,
    name: "Sofia Romano",
    email: "sofia.romano@reuters.com",
    phone: "+39 06 9876 5432",
    role: "Junior Editor",
    bureau: "Rome",
    status: "active",
    shiftsThisMonth: 16,
    initials: "SR",
  },
  {
    id: 3,
    name: "Luca Ferrari",
    email: "luca.ferrari@reuters.com",
    phone: "+39 02 5555 1234",
    role: "Lead Editor",
    bureau: "Milan",
    status: "active",
    shiftsThisMonth: 20,
    initials: "LF",
  },
  {
    id: 4,
    name: "Giulia Bianchi",
    email: "giulia.bianchi@reuters.com",
    phone: "+39 06 4444 5678",
    role: "Senior Editor",
    bureau: "Rome",
    status: "active",
    shiftsThisMonth: 17,
    initials: "GB",
  },
  {
    id: 5,
    name: "Alessandro Conti",
    email: "alessandro.conti@reuters.com",
    phone: "+39 02 7777 8888",
    role: "Junior Editor",
    bureau: "Milan",
    status: "active",
    shiftsThisMonth: 15,
    initials: "AC",
  },
  {
    id: 6,
    name: "Francesca Marino",
    email: "francesca.marino@reuters.com",
    phone: "+39 06 3333 2222",
    role: "Senior Editor",
    bureau: "Rome",
    status: "active",
    shiftsThisMonth: 19,
    initials: "FM",
  },
  {
    id: 7,
    name: "Matteo Ricci",
    email: "matteo.ricci@reuters.com",
    phone: "+39 02 9999 0000",
    role: "Junior Editor",
    bureau: "Milan",
    status: "on-leave",
    shiftsThisMonth: 8,
    initials: "MR",
  },
  {
    id: 8,
    name: "Elena Greco",
    email: "elena.greco@reuters.com",
    phone: "+39 06 1111 2222",
    role: "Lead Editor",
    bureau: "Rome",
    status: "active",
    shiftsThisMonth: 21,
    initials: "EG",
  },
]

export default function EmployeesPage() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBureau, setFilterBureau] = useState("all")
  const [filterRole, setFilterRole] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Fetch employees from API
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const response = await api.employees.list()
        const employeeData = response.employees.map((emp: any) => ({
          id: emp.id,
          name: emp.full_name,
          email: emp.email,
          phone: emp.phone || "+39 02 0000 0000",
          role: emp.title || emp.shift_role,
          bureau: emp.bureaus?.name || emp.bureau || "Milan",
          status: emp.status || "active",
          shiftsThisMonth: 0, // TODO: Calculate from shifts
          initials: emp.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "??",
        }))
        setEmployees(employeeData)
      } catch (error: any) {
        console.error("Failed to fetch employees:", error)
        toast({
          title: "Failed to load employees",
          description: error.message || "Using cached data",
          variant: "destructive",
        })
        // Fallback to mock data
        setEmployees(mockEmployees)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [toast])

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBureau = filterBureau === "all" || emp.bureau === filterBureau
    const matchesRole = filterRole === "all" || emp.role === filterRole
    return matchesSearch && matchesBureau && matchesRole
  })

  // Calculate stats
  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === "active").length,
    milan: employees.filter((e) => e.bureau === "Milan").length,
    rome: employees.filter((e) => e.bureau === "Rome").length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Directory</h1>
          <p className="text-muted-foreground">Manage Breaking News team members</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Add a new team member to the directory</DialogDescription>
            </DialogHeader>
            <EmployeeForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Milan Bureau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.milan}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rome Bureau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rome}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterBureau} onValueChange={setFilterBureau}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Bureau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bureaus</SelectItem>
                <SelectItem value="Milan">Milan</SelectItem>
                <SelectItem value="Rome">Rome</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Lead Editor">Lead Editor</SelectItem>
                <SelectItem value="Senior Editor">Senior Editor</SelectItem>
                <SelectItem value="Junior Editor">Junior Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Views */}
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        {/* Table View */}
        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Bureau</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Shifts This Month</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">{employee.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">{employee.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {employee.bureau}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {employee.phone}
                        </div>
                      </TableCell>
                      <TableCell>{employee.shiftsThisMonth}</TableCell>
                      <TableCell>
                        <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/employees/${employee.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 transition-transform hover:scale-110"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive transition-transform hover:scale-110"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Card View */}
        <TabsContent value="cards">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {employee.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{employee.name}</CardTitle>
                        <CardDescription>{employee.role}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={employee.status === "active" ? "default" : "secondary"}>{employee.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.bureau}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-sm text-muted-foreground">Shifts This Month</div>
                    <div className="text-2xl font-bold">{employee.shiftsThisMonth}</div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/employees/${employee.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent transition-all hover:scale-105"
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive bg-transparent transition-transform hover:scale-110"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmployeeForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" placeholder="Marco Rossi" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="marco.rossi@reuters.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" placeholder="+39 02 1234 5678" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select>
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead Editor</SelectItem>
            <SelectItem value="senior">Senior Editor</SelectItem>
            <SelectItem value="junior">Junior Editor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bureau">Bureau</Label>
        <Select>
          <SelectTrigger id="bureau">
            <SelectValue placeholder="Select bureau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="milan">Milan</SelectItem>
            <SelectItem value="rome">Rome</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select defaultValue="active">
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Add Employee</Button>
      </div>
    </form>
  )
}
