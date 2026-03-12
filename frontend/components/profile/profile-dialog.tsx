"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useStudentConnections } from "@/hooks/use-student-connections"
import { Button } from "@/components/ui/button"
import { LogOut, Trash2, User, GraduationCap, Check, X, Users } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { apiClient, type Student } from "@/lib/api"

export function ProfileDialog() {
  const { user, signOut } = useAuth()
  const {
    connectedStudents,
    connectedToUser,
    pendingRequests,
    acceptRequest,
    declineRequest,
    disconnectStudent,
    disconnectFromUser,
    loadAll,
  } = useStudentConnections()
  const [isOpen, setIsOpen] = useState(false)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [decliningId, setDecliningId] = useState<string | null>(null)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) loadAll()
  }, [isOpen])

  // Merge connectedStudents and connectedToUser into one deduplicated "friends" list
  const friends = useMemo<Student[]>(() => {
    const seen = new Set<string>()
    const result: Student[] = []
    for (const s of [...connectedStudents, ...connectedToUser]) {
      const key = s.email || s.id
      if (!seen.has(key)) {
        seen.add(key)
        result.push(s)
      }
    }
    return result
  }, [connectedStudents, connectedToUser])

  const handleLogout = () => {
    if (confirm("Выйти из аккаунта?")) signOut()
  }

  const handleDelete = async () => {
    if (confirm("Полностью удалить аккаунт? Это действие необратимо.")) {
      await apiClient.deleteUser()
      signOut()
    }
  }

  const handleAccept = async (id: string) => {
    setAcceptingId(id)
    try { await acceptRequest(id) } finally { setAcceptingId(null) }
  }

  const handleDecline = async (id: string) => {
    setDecliningId(id)
    try { await declineRequest(id) } finally { setDecliningId(null) }
  }

  const handleRemoveFriend = async (friend: Student) => {
    setRemovingEmail(friend.email)
    try {
      // Remove both directions to fully unfriend
      await Promise.allSettled([
        disconnectStudent(friend.email),
        disconnectFromUser(friend.email),
      ])
    } finally {
      setRemovingEmail(null)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Личный кабинет</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">

          {/* User info */}
          <div className="space-y-1 bg-secondary/30 p-4 rounded-lg">
            <h3 className="font-bold text-lg">{user.fullname}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-4 w-4" /> {user.group}
            </p>
          </div>

          <Accordion type="multiple" defaultValue={["item-pending", "item-friends"]} className="w-full">

            {/* Pending requests */}
            {pendingRequests && pendingRequests.length > 0 && (
              <AccordionItem value="item-pending" className="border-primary/20">
                <AccordionTrigger className="text-primary font-medium">
                  Запросы в друзья ({pendingRequests.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="p-3 bg-secondary/20 rounded-md flex flex-col gap-2">
                        <div>
                          <span className="font-medium text-sm">{req.fullname || req.email}</span>
                          <p className="text-xs text-muted-foreground">{req.group}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAccept(req.id)} disabled={acceptingId === req.id}
                            className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <Check className="mr-1 h-4 w-4" />
                            {acceptingId === req.id ? "..." : "Принять"}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDecline(req.id)} disabled={decliningId === req.id}
                            className="w-full">
                            <X className="mr-1 h-4 w-4" />
                            {decliningId === req.id ? "..." : "Отказать"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Friends (merged list) */}
            <AccordionItem value="item-friends">
              <AccordionTrigger className="text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Друзья ({friends.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center">Нет друзей. Добавьте через «+» или ссылку-приглашение.</p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {friends.map((friend) => (
                      <div key={friend.email} className="flex items-center justify-between p-2 bg-background/50 rounded-md">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{friend.fullname || friend.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{friend.group}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          disabled={removingEmail === friend.email}
                          onClick={() => handleRemoveFriend(friend)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 border-t">
            <Button variant="outline" onClick={handleLogout} className="w-full justify-start text-foreground">
              <LogOut className="mr-2 h-4 w-4" /> Выйти
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full justify-start">
              <Trash2 className="mr-2 h-4 w-4" /> Удалить аккаунт
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
