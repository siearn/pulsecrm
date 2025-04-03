"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { MoreHorizontal, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Lead {
  id: string
  name: string
  email: string | null
  company: string | null
  status: string
  value: number | null
  assignedTo: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  createdAt: Date
  updatedAt: Date
}

interface TeamMember {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface LeadsPipelineProps {
  leads: Lead[]
  teamMembers: TeamMember[]
}

const statusOrder = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]

const statusLabels = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
}

export function LeadsPipeline({ leads, teamMembers }: LeadsPipelineProps) {
  const [items, setItems] = useState(leads)

  // Group leads by status
  const leadsByStatus = statusOrder.reduce(
    (acc, status) => {
      acc[status] = items.filter((lead) => lead.status === status)
      return acc
    },
    {} as Record<string, Lead[]>,
  )

  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result

    // Dropped outside the list
    if (!destination) {
      return
    }

    // Dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // Find the lead that was dragged
    const lead = items.find((item) => item.id === draggableId)

    if (!lead) return

    // Create a new array without the dragged lead
    const newItems = items.filter((item) => item.id !== draggableId)

    // Create a new lead with the updated status
    const updatedLead = {
      ...lead,
      status: destination.droppableId,
    }

    // Add the updated lead to the new array
    setItems([...newItems, updatedLead])

    // Here you would also make an API call to update the lead status in the database
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto">
        {statusOrder.map((status) => (
          <Droppable key={status} droppableId={status}>
            {(provided) => (
              <Card className="min-w-[250px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <div className="flex items-center">
                      {statusLabels[status as keyof typeof statusLabels]}{" "}
                      <span className="ml-2 text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                        {leadsByStatus[status]?.length || 0}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add lead</span>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 min-h-[200px]">
                    {leadsByStatus[status]?.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="rounded-md border bg-card text-card-foreground shadow-sm p-3"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{lead.name}</h3>
                                <p className="text-sm text-muted-foreground">{lead.company || "No company"}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>Assign</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="mt-2 flex justify-between items-center">
                              <div className="text-sm font-medium">${lead.value?.toLocaleString() || "0"}</div>
                              {lead.assignedTo ? (
                                <Avatar className="h-6 w-6">
                                  {lead.assignedTo.image ? (
                                    <AvatarImage src={lead.assignedTo.image} alt={lead.assignedTo.name || ""} />
                                  ) : (
                                    <AvatarFallback>
                                      {lead.assignedTo.name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("") || "?"}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              ) : (
                                <div className="text-xs text-muted-foreground">Unassigned</div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </CardContent>
              </Card>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}

