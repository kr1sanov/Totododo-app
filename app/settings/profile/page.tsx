"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/back-button"

interface TelegramProfile {
  telegram_id: string
  chat_id: string
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<TelegramProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("telegram_users")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <BackButton />
      <div className="mt-4 space-y-4">
        <h1 className="text-2xl font-bold">Профиль</h1>

        <Card>
          <CardHeader>
            <CardTitle>Telegram профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.photo_url} />
                <AvatarFallback>
                  {profile?.first_name?.[0]}
                  {profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">
                  {profile?.first_name} {profile?.last_name}
                </div>
                {profile?.username && (
                  <div className="text-sm text-muted-foreground">@{profile.username}</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Telegram ID</span>
                <Badge variant="outline">{profile?.telegram_id}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User ID</span>
                <Badge variant="outline">{user?.id}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{user?.email || "Не указан"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
