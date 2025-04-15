import React, { useState, useEffect } from "react"
import { Check, Pencil, Plus, Save, Trash, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SelectField from "../StudentTable/SelectField"
import { api } from "@/lib/api"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { RecordExtended, FullStudentData } from "@/types"

// --------------------------------------------------------

async function getFullStudentData(id : number): Promise<FullStudentData> {
  const response = await api.students.fullInfo[':id'].$get({param: {id: id.toString() } });
  const data = await response.json();
  const getFullStudentDataWithDates = {
    ...data.fullInfo,
    student: {
      ...data.fullInfo.student,
      fecha_nac: new Date(data.fullInfo.student.fecha_nac),
    },
  };

  return getFullStudentDataWithDates;
}

interface StudentProfilePanelProps {
  id: number;
  isOpen: boolean;
  onClose: () => void;
}

const StudentProfilePanel: React.FC<StudentProfilePanelProps> = ({ id, isOpen, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [currentRecord, setCurrentRecord] = useState<RecordExtended | undefined>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPersonalInfo, setEditedPersonalInfo] = useState({})
  const [editedCourses, setEditedCourses] = useState([])
  const [newCourse, setNewCourse] = useState({ code: "", name: "", grade: "" })
  const [isAddingCourse, setIsAddingCourse] = useState(false)

  const queryClient = useQueryClient();

  const { isPending: fullDataLoading, error: fullDataError, data: fullData } = useQuery({
    queryKey: ['full-student-data', id],
    queryFn: ({ queryKey }) => {
      // Extract the id from the queryKey array
      const [_key, studentId] = queryKey;
      return getFullStudentData(studentId as number);
    }
  });

  const periodOptions = fullData?.records?.map((record) => ({
    value: `${record.ano_inicio}-${record.ano_fin}`,
    label: `${record.ano_inicio}-${record.ano_fin}`,
    record: record,
  })) || [];

  /* useEffect(() => {
    if (student) {...data.fullInfo.student,
      const record = student.records.find((r) => r.period === selectedPeriod)
      setCurrentRecord(record)
      if (record) {
        setEditedCourses([...record.cycle.courses])
      }
    }
  }, [selectedPeriod, student]) */

  /* useEffect(() => {
    if (student) {
      setEditedPersonalInfo({
        name: student.name,
        email: student.email,
        department: student.department,
      })
    }
  }, [student]) */

  /* const handleEditToggle = () => {
    if (isEditMode) {
      // Discard changes if canceling
      setIsEditMode(false)
      setIsAddingCourse(false)
      // Reset edited data
      if (currentRecord) {
        setEditedCourses([...currentRecord.cycle.courses])
      }
      setEditedPersonalInfo({
        name: student.name,
        email: student.email,
        department: student.department,
      })
    } else {
      setIsEditMode(true)
    }
  } */

  /* const handleSaveChanges = () => {
    // Create a deep copy of the student object
    const updatedStudent = JSON.parse(JSON.stringify(student))

    // Update personal information
    updatedStudent.name = editedPersonalInfo.name
    updatedStudent.email = editedPersonalInfo.email
    updatedStudent.department = editedPersonalInfo.department

    // Update courses for the current record
    const recordIndex = updatedStudent.records.findIndex((r) => r.period === selectedPeriod)
    if (recordIndex !== -1) {
      updatedStudent.records[recordIndex].cycle.courses = [...editedCourses]
    }

    // Update the student state
    setStudent(updatedStudent)
    setIsEditMode(false)
    setIsAddingCourse(false)
  } */

  /* const handlePersonalInfoChange = (field, value) => {
    setEditedPersonalInfo((prev) => ({
      ...prev,
      [field]: value,
    }))
  } */

  /* const handleCourseChange = (index, field, value) => {
    const updatedCourses = [...editedCourses]
    updatedCourses[index] = {
      ...updatedCourses[index],
      [field]: value,
    }
    setEditedCourses(updatedCourses)
  } */

  /* const handleAddCourse = () => {
    if (newCourse.code && newCourse.name) {
      setEditedCourses([...editedCourses, { ...newCourse }])
      setNewCourse({ code: "", name: "", grade: "" })
      setIsAddingCourse(false)
    }
  } */

  /* const handleDeleteCourse = (index) => {
    const updatedCourses = [...editedCourses]
    updatedCourses.splice(index, 1)
    setEditedCourses(updatedCourses)
  } */

  /* if (!student) return null */

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open : boolean) => {
        if (!open) {
          onClose()
          setIsEditMode(false)
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-4">
          <SheetTitle className="text-xl font-bold">Perfil del estudiante</SheetTitle>
          <div className="flex space-x-2">
            {isEditMode ? (
              <>
                <Button variant="outline" size="sm" /* onClick={handleEditToggle} */>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button variant="default" size="sm" /* onClick={handleSaveChanges} */>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="mr-5" /* onClick={handleEditToggle} */>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] pr-4">
          <div className="space-y-6">
            {/* Student Information */}
            <Card>
              <CardHeader>
                <CardTitle>Información personal:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre:</Label>
                      <Input
                        id="name"
                        value={fullData?.student.nombre || ""}
                        /* onChange={(e) => handlePersonalInfoChange("name", e.target.value)} */
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido1">Apellido 1:</Label>
                      <Input
                        id="apellido1"
                        value={fullData?.student.apellido_1 || ""}
                        /* onChange={(e) => handlePersonalInfoChange("name", e.target.value)} */
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellido2">Apellido 2:</Label>
                      <Input
                        id="apellido2"
                        value={fullData?.student.apellido_2 || ""}
                        /* onChange={(e) => handlePersonalInfoChange("name", e.target.value)} */
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium text-muted-foreground">ID Legal:</div>
                      <div>{fullData?.student.id_estudiante}</div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fecha_nac">Fecha de nacimiento:</Label>
                      <Input
                        id="fecha_nac"
                        value={fullData?.student.fecha_nac.toDateString() || ""}
                        /* onChange={(e) => handlePersonalInfoChange("email", e.target.value)} */
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium text-muted-foreground">Nombre:</div>
                    <div>{fullData?.student.nombre}</div>

                    <div className="text-sm font-medium text-muted-foreground">Apellido 1:</div>
                    <div>{fullData?.student.apellido_1}</div>
                    
                    <div className="text-sm font-medium text-muted-foreground">Apellido 2:</div>
                    <div>{fullData?.student.apellido_2}</div>

                    <div className="text-sm font-medium text-muted-foreground">ID Legal:</div>
                    <div>{fullData?.student.id_legal}</div>

                    <div className="text-sm font-medium text-muted-foreground">Fecha de nacimiento:</div>
                    <div>{fullData?.student.fecha_nac.toDateString()}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Academic Records */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Records</CardTitle>
                <CardDescription>Selecciona un año académico.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Year Selection Dropdown */}
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-muted-foreground">Año académico:</div>
                    <SelectField
                      label="Periodo"
                      name="period"
                      value={selectedPeriod || (periodOptions[0]?.value ?? "")}
                      onValueChange={(value) => {
                        setSelectedPeriod(value);
                        setCurrentRecord(periodOptions.find(option => option.value === selectedPeriod)?.record)
                        setIsAddingCourse(false);
                      }}
                      placeholder="Seleccionar periodo"
                      options={periodOptions}
                    />
                  </div>

                  {/* Display selected year's cycle (degree) and courses */}
                  {selectedPeriod && (
                    <div className="mt-6">
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold">test</h3>
                          {/* {selectedPeriod === "2024-2025" && (
                            <Badge className="ml-2" variant="outline">
                              Current
                            </Badge>
                          )} */}
                        </div>
                        <p className="text-sm text-muted-foreground">Año académico: {selectedPeriod}</p>
                      </div>

                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-2 text-left text-sm font-medium">Course Code</th>
                              <th className="p-2 text-left text-sm font-medium">Course Name</th>
                              <th className="p-2 text-left text-sm font-medium">Grade</th>
                              {isEditMode && <th className="p-2 text-left text-sm font-medium w-[80px]">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {/* {(isEditMode ? editedCourses : currentRecord?.enrollments?).map((codigo_modulo, nombre_modulo, status, ) => (
                              <tr key={courseIndex} className="border-b last:border-0">
                                <td className="p-2 text-sm">
                                  {isEditMode ? (
                                    <Input
                                      value={course.code}
                                      onChange={(e) => handleCourseChange(courseIndex, "code", e.target.value)}
                                      className="h-8 text-sm"
                                    />
                                  ) : (
                                    course.code
                                  )}
                                </td>
                                <td className="p-2 text-sm">
                                  {isEditMode ? (
                                    <Input
                                      value={course.name}
                                      onChange={(e) => handleCourseChange(courseIndex, "name", e.target.value)}
                                      className="h-8 text-sm"
                                    />
                                  ) : (
                                    course.name
                                  )}
                                </td>
                                <td className="p-2 text-sm">
                                  {isEditMode ? (
                                    <Select
                                      value={course.grade}
                                      onValueChange={(value) => handleCourseChange(courseIndex, "grade", value)}
                                    >
                                      <SelectTrigger className="h-8 text-sm w-[120px]">
                                        <SelectValue placeholder="Select grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="A">A</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B">B</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="C+">C+</SelectItem>
                                        <SelectItem value="C">C</SelectItem>
                                        <SelectItem value="C-">C-</SelectItem>
                                        <SelectItem value="D">D</SelectItem>
                                        <SelectItem value="F">F</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : course.grade === "In Progress" ? (
                                    <Badge variant="secondary">{course.grade}</Badge>
                                  ) : (
                                    course.grade
                                  )}
                                </td>
                                {isEditMode && (
                                  <td className="p-2 text-sm">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteCourse(courseIndex)}
                                      className="h-8 w-8"
                                    >
                                      <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                            {isAddingCourse && (
                              <tr className="border-b last:border-0 bg-muted/30">
                                <td className="p-2 text-sm">
                                  <Input
                                    value={newCourse.code}
                                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                    placeholder="Course code"
                                    className="h-8 text-sm"
                                  />
                                </td>
                                <td className="p-2 text-sm">
                                  <Input
                                    value={newCourse.name}
                                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                    placeholder="Course name"
                                    className="h-8 text-sm"
                                  />
                                </td>
                                <td className="p-2 text-sm">
                                  <Select
                                    value={newCourse.grade}
                                    onValueChange={(value) => setNewCourse({ ...newCourse, grade: value })}
                                  >
                                    <SelectTrigger className="h-8 text-sm w-[120px]">
                                      <SelectValue placeholder="Select grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="A">A</SelectItem>
                                      <SelectItem value="A-">A-</SelectItem>
                                      <SelectItem value="B+">B+</SelectItem>
                                      <SelectItem value="B">B</SelectItem>
                                      <SelectItem value="B-">B-</SelectItem>
                                      <SelectItem value="C+">C+</SelectItem>
                                      <SelectItem value="C">C</SelectItem>
                                      <SelectItem value="C-">C-</SelectItem>
                                      <SelectItem value="D">D</SelectItem>
                                      <SelectItem value="F">F</SelectItem>
                                      <SelectItem value="In Progress">In Progress</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="p-2 text-sm">
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleAddCourse}
                                      className="h-8 w-8"
                                      disabled={!newCourse.code || !newCourse.name}
                                    >
                                      <Check className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setIsAddingCourse(false)}
                                      className="h-8 w-8"
                                    >
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )} */}
                          </tbody>
                        </table>
                      </div>

                      {isEditMode && !isAddingCourse && (
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddingCourse(true)}>
                          <Plus className="h-4 w-4 mr-1" /> Add Course
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Summary</CardTitle>
              </CardHeader>
              {/* <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Academic Years:</span>
                    <span>{student.records.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Degrees/Programs:</span>
                    <span>{new Set(student.records.map((record) => record.cycle.name)).size}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Courses:</span>
                    <span>{student.records.reduce((total, record) => total + record.cycle.courses.length, 0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Current Courses:</span>
                    <span>
                      {student.records.reduce(
                        (total, record) =>
                          total + record.cycle.courses.filter((course) => course.grade === "In Progress").length,
                        0,
                      )}
                    </span>
                  </div>
                </div>
              </CardContent> */}
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
};

export default StudentProfilePanel;