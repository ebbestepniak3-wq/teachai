// app/(app)/settings/profile/page.tsx
import { Metadata } from 'next'
import { getServerUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Camera, Save } from 'lucide-react'
import { getInitials } from '@/lib/utils'

export const metadata: Metadata = { title: 'Profil' }

const BUNDESLAENDER = [
  'Baden-Württemberg','Bayern','Berlin','Brandenburg','Bremen',
  'Hamburg','Hessen','Mecklenburg-Vorpommern','Niedersachsen',
  'Nordrhein-Westfalen','Rheinland-Pfalz','Saarland','Sachsen',
  'Sachsen-Anhalt','Schleswig-Holstein','Thüringen',
]

const SCHULFORMEN = [
  'Grundschule','Hauptschule','Realschule','Gesamtschule',
  'Gymnasium','Berufsschule','Förderschule','Sonstige',
]

export default async function ProfilePage() {
  const jwtUser = await getServerUser()
  if (!jwtUser) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: jwtUser.sub } })
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profilbild</CardTitle>
          <CardDescription>Ihr Avatar wird in der gesamten Plattform angezeigt.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary shadow-sm transition-transform hover:scale-110">
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={user.emailVerified ? 'success' : 'warning'} className="text-[10px]">
                {user.emailVerified ? 'E-Mail verifiziert' : 'Nicht verifiziert'}
              </Badge>
              <Badge variant="outline" className="text-[10px] capitalize">
                {user.role === 'ADMIN' ? 'Administrator' : 'Lehrkraft'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Persönliche Daten</CardTitle>
          <CardDescription>Aktualisieren Sie Ihre persönlichen Angaben.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Vollständiger Name</label>
                <input
                  defaultValue={user.name}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-Mail-Adresse</label>
                <input
                  defaultValue={user.email}
                  type="email"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bundesland</label>
                <select
                  defaultValue={user.bundesland ?? ''}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Bitte wählen</option>
                  {BUNDESLAENDER.map((bl) => (
                    <option key={bl} value={bl}>{bl}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Schulform</label>
                <select
                  defaultValue={user.schulform ?? ''}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Bitte wählen</option>
                  {SCHULFORMEN.map((sf) => (
                    <option key={sf} value={sf}>{sf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Über mich (optional)</label>
              <textarea
                defaultValue={user.bio ?? ''}
                rows={3}
                placeholder="Erzählen Sie etwas über sich..."
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end">
              <Button variant="gradient">
                <Save className="h-4 w-4" />
                Änderungen speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Gefahrenzone</CardTitle>
          <CardDescription>Irreversible Aktionen – bitte mit Bedacht verwenden.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Konto löschen</p>
            <p className="text-xs text-muted-foreground">
              Alle Daten werden unwiderruflich gelöscht (DSGVO Art. 17).
            </p>
          </div>
          <Button variant="destructive" size="sm">Konto löschen</Button>
        </CardContent>
      </Card>
    </div>
  )
}
