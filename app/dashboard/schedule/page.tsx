"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core"
import { useDraggable, useDroppable } from "@dnd-kit/core"

import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Copy, Filter, ChevronLeft, ChevronRight, GripVertical } from "lucide-react"
import {
  format,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  startOfQuarter,
  endOfQuarter,
} from "date-fns"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

// Mock data for shifts as fallback
const mockShifts = [
  {
    id: 1,
    employee: "Marco Rossi",
    role: "Senior Editor",
    bureau: "Milan",
    date: new Date(2025, 9, 30),
    startTime: "08:00",
    endTime: "16:00",
    status: "confirmed",
  },
  {
    id: 2,
    employee: "Sofia Romano",
    role: "Junior Editor",
    bureau: "Rome",
    date: new Date(2025, 9, 30),
    startTime: "16:00",
    endTime: "00:00",
    status: "confirmed",
  },
  {
    id: 3,
    employee: "Luca Ferrari",
    role: "Lead Editor",
    bureau: "Milan",
    date: new Date(2025, 9, 31),
    startTime: "00:00",
    endTime: "08:00",
    status: "pending",
  },
  {
    id: 4,
    employee: "Giulia Bianchi",
    role: "Senior Editor",
    bureau: "Rome",
    date: new Date(2025, 9, 31),
    startTime: "08:00",
    endTime: "16:00",
    status: "confirmed",
  },
  {
    id: 5,
    employee: "Alessandro Conti",
    role: "Junior Editor",
    bureau: "Milan",
    date: new Date(2025, 9, 31),
    startTime: "16:00",
    endTime: "00:00",
    status: "confirmed",
  },
]

const employees = [
  { id: 1, name: "Marco Rossi", role: "Senior Editor", bureau: "Milan" },
  { id: 2, name: "Sofia Romano", role: "Junior Editor", bureau: "Rome" },
  { id: 3, name: "Luca Ferrari", role: "Lead Editor", bureau: "Milan" },
  { id: 4, name: "Giulia Bianchi", role: "Senior Editor", bureau: "Rome" },
  { id: 5, name: "Alessandro Conti", role: "Junior Editor", bureau: "Milan" },
]

function DraggableShift({ shift, view = "week" }: { shift: any; view?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `shift-${shift.id}`,
    data: { shift },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  if (view === "month") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="bg-primary/10 border border-primary/20 rounded px-1.5 py-1 text-[10px] cursor-grab active:cursor-grabbing hover:bg-primary/20 transition-all hover:shadow-sm"
      >
        <div className="flex items-center gap-1">
          <GripVertical className="h-2 w-2 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{shift.employee.split(" ")[0]}</div>
            <div className="text-muted-foreground truncate">{shift.startTime}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-primary/10 border border-primary/20 rounded p-2 text-xs cursor-grab active:cursor-grabbing hover:bg-primary/20 transition-all hover:shadow-md group"
    >
      <div className="flex items-start gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{shift.employee}</div>
          <div className="text-muted-foreground">
            {shift.startTime} - {shift.endTime}
          </div>
          <Badge variant="secondary" className="mt-1 text-[10px] h-4">
            {shift.bureau}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function DroppableDay({ date, children, isActive }: { date: Date; children: React.ReactNode; isActive?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${format(date, "yyyy-MM-dd")}`,
    data: { date },
  })

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-lg p-3 min-h-[200px] transition-all ${
        isOver ? "bg-primary/5 border-primary ring-2 ring-primary/20" : ""
      } ${isActive ? "ring-1 ring-primary/30" : ""}`}
    >
      {children}
    </div>
  )
}

function DroppableMonthDay({
  day,
  children,
  isCurrentMonth,
}: {
  day: Date | null
  children: React.ReactNode
  isCurrentMonth?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: day ? `day-${format(day, "yyyy-MM-dd")}` : `empty-${Math.random()}`,
    data: { date: day },
    disabled: !day,
  })

  if (!day) {
    return <div className="border rounded-lg p-2 min-h-[120px] bg-muted/20" />
  }

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-lg p-2 min-h-[120px] transition-all ${
        !isCurrentMonth ? "bg-muted/20 text-muted-foreground" : ""
      } ${isOver ? "bg-primary/5 border-primary ring-2 ring-primary/20" : ""}`}
    >
      {children}
    </div>
  )
}

export default function SchedulePage() {
  const { toast } = useToast()
  const [shifts, setShifts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedView, setSelectedView] = useState("week")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentQuarter, setCurrentQuarter] = useState(new Date())
  const [activeShift, setActiveShift] = useState<any>(null)

  // Fetch shifts from API
  useEffect(() => {
    async function fetchShifts() {
      try {
        const response = await api.shifts.list({
          start_date: format(addDays(new Date(), -30), "yyyy-MM-dd"),
          end_date: format(addDays(new Date(), 60), "yyyy-MM-dd"),
        })
        
        const shiftData = response.shifts.map((shift: any) => ({
          id: shift.id,
          employee: shift.users?.full_name || "Unassigned",
          role: shift.users?.title || shift.users?.shift_role || "Unknown",
          bureau: shift.bureaus?.name || "Milan",
          date: new Date(shift.start_time),
          startTime: format(new Date(shift.start_time), "HH:mm"),
          endTime: format(new Date(shift.end_time), "HH:mm"),
          status: shift.status || "pending",
        }))
        
        setShifts(shiftData)
      } catch (error: any) {
        console.error("Failed to fetch shifts:", error)
        toast({
          title: "Failed to load shifts",
          description: error.message || "Using cached data",
          variant: "destructive",
        })
        // Fallback to mock data
        setShifts(mockShifts)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShifts()
  }, [toast])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const weekStart = startOfWeek(new Date())
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const firstDayOfMonth = monthStart.getDay()
  const monthCalendarDays = [...Array(firstDayOfMonth).fill(null), ...monthDays]

  const quarterStart = startOfQuarter(currentQuarter)
  const quarterEnd = endOfQuarter(currentQuarter)
  const quarterMonths = [quarterStart, addMonths(quarterStart, 1), addMonths(quarterStart, 2)]

  const getShiftsForDate = (date: Date) => {
    return shifts.filter((shift) => format(shift.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))
  }

  const getShiftCountForDate = (date: Date) => {
    return shifts.filter((shift) => format(shift.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")).length
  }

  const handleDragStart = (event: DragStartEvent) => {
    const shift = event.active.data.current?.shift
    setActiveShift(shift)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveShift(null)

    if (!over) return

    const shiftId = active.data.current?.shift?.id
    const newDate = over.data.current?.date

    if (shiftId && newDate) {
      try {
        // Update via API
        await api.shifts.move(shiftId, format(newDate, "yyyy-MM-dd"))
        
        // Update local state
        setShifts((prevShifts) =>
          prevShifts.map((shift) => (shift.id === shiftId ? { ...shift, date: new Date(newDate) } : shift)),
        )
        
        toast({
          title: "Shift moved",
          description: "Shift has been successfully moved to the new date",
        })
      } catch (error: any) {
        toast({
          title: "Failed to move shift",
          description: error.message,
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schedule Management</h1>
            <p className="text-muted-foreground">Create and manage shift assignments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shift
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Shift</DialogTitle>
                  <DialogDescription>Add a new shift assignment to the schedule</DialogDescription>
                </DialogHeader>
                <ShiftForm onClose={() => setIsAddDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <TabsList>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="month">Monthly View</TabsTrigger>
            <TabsTrigger value="quarter">Quarterly View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
          </TabsList>

          {/* Week View */}
          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  {format(weekStart, "MMMM dd")} - {format(addDays(weekStart, 6), "MMMM dd, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const dayShifts = getShiftsForDate(day)
                    return (
                      <DroppableDay key={day.toISOString()} date={day}>
                        <div className="font-semibold text-sm mb-2">
                          {format(day, "EEE")}
                          <div className="text-xs text-muted-foreground">{format(day, "MMM dd")}</div>
                        </div>
                        <div className="space-y-2">
                          {dayShifts.map((shift) => (
                            <DraggableShift key={shift.id} shift={shift} view="week" />
                          ))}
                        </div>
                      </DroppableDay>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Monthly Schedule</CardTitle>
                    <CardDescription>{format(currentMonth, "MMMM yyyy")}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                      Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center font-semibold text-sm py-2">
                      {day}
                    </div>
                  ))}
                  {monthCalendarDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="border rounded-lg p-2 min-h-[120px] bg-muted/20" />
                    }
                    const dayShifts = getShiftsForDate(day)
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    return (
                      <DroppableMonthDay key={day.toISOString()} day={day} isCurrentMonth={isCurrentMonth}>
                        <div className="font-semibold text-sm mb-2">{format(day, "d")}</div>
                        <div className="space-y-1">
                          {dayShifts.slice(0, 3).map((shift) => (
                            <DraggableShift key={shift.id} shift={shift} view="month" />
                          ))}
                          {dayShifts.length > 3 && (
                            <div className="text-[10px] text-muted-foreground text-center">
                              +{dayShifts.length - 3} more
                            </div>
                          )}
                        </div>
                      </DroppableMonthDay>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quarter" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quarterly Schedule</CardTitle>
                    <CardDescription>
                      Q{Math.floor(quarterStart.getMonth() / 3) + 1} {format(quarterStart, "yyyy")} (
                      {format(quarterStart, "MMM")} - {format(quarterEnd, "MMM")})
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentQuarter(addMonths(currentQuarter, -3))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentQuarter(new Date())}>
                      Current Quarter
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentQuarter(addMonths(currentQuarter, 3))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {quarterMonths.map((month) => {
                    const monthStart = startOfMonth(month)
                    const monthEnd = endOfMonth(month)
                    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
                    const firstDay = monthStart.getDay()
                    const calendarDays = [...Array(firstDay).fill(null), ...monthDays]

                    return (
                      <Card key={month.toISOString()}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{format(month, "MMMM yyyy")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-7 gap-1">
                            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                              <div key={`${month}-${day}-${i}`} className="text-center text-[10px] font-semibold py-1">
                                {day}
                              </div>
                            ))}
                            {calendarDays.map((day, index) => {
                              if (!day) {
                                return <div key={`empty-${month}-${index}`} className="aspect-square" />
                              }
                              const shiftCount = getShiftCountForDate(day)
                              return (
                                <div
                                  key={day.toISOString()}
                                  className={`aspect-square flex items-center justify-center text-[10px] rounded cursor-pointer hover:bg-muted transition-colors ${
                                    shiftCount > 0 ? "bg-primary/10 border border-primary/20 font-semibold" : "border"
                                  }`}
                                >
                                  <div className="text-center">
                                    <div>{format(day, "d")}</div>
                                    {shiftCount > 0 && <div className="text-[8px] text-primary">{shiftCount}</div>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Shifts</CardTitle>
                <CardDescription>Complete list of scheduled shifts</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Bureau</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.employee}</TableCell>
                        <TableCell>{shift.role}</TableCell>
                        <TableCell>{shift.bureau}</TableCell>
                        <TableCell>{format(shift.date, "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          {shift.startTime} - {shift.endTime}
                        </TableCell>
                        <TableCell>
                          <Badge variant={shift.status === "confirmed" ? "default" : "secondary"}>{shift.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="mr-2 h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Copy className="mr-2 h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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

          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shifts.map((shift) => (
                <Card key={shift.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{shift.employee}</CardTitle>
                        <CardDescription>{shift.role}</CardDescription>
                      </div>
                      <Badge variant={shift.status === "confirmed" ? "default" : "secondary"}>{shift.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bureau:</span>
                      <span className="font-medium">{shift.bureau}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(shift.date, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Copy className="mr-2 h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DragOverlay>
          {activeShift ? (
            <div className="bg-primary/20 border-2 border-primary rounded p-2 text-xs shadow-lg rotate-3">
              <div className="font-medium">{activeShift.employee}</div>
              <div className="text-muted-foreground">
                {activeShift.startTime} - {activeShift.endTime}
              </div>
              <Badge variant="secondary" className="mt-1 text-[10px] h-4">
                {activeShift.bureau}
              </Badge>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

function ShiftForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee">Employee</Label>
        <Select>
          <SelectTrigger id="employee">
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id.toString()}>
                {emp.name} - {emp.role}
              </SelectItem>
            ))}
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
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input id="startTime" type="time" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input id="endTime" type="time" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select defaultValue="pending">
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create Shift</Button>
      </div>
    </form>
  )
}
