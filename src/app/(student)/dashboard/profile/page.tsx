import { requireStudent } from "@/lib/student-auth"
import { User, Phone, Mail, MapPin, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AvatarUpload } from "@/components/profile/avatar-upload"

export default async function DashboardProfilePage() {
  const { student } = await requireStudent()

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and account settings.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-sm text-center">
            <CardContent className="pt-6">
              <AvatarUpload studentId={student.id} initialAvatar={student.avatar} />
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-sm text-muted-foreground">{student.username || 'Student'}</p>
              
              <div className="mt-6 space-y-3 text-sm text-left">
                <div className="flex items-center text-slate-600">
                  <Phone className="mr-3 h-4 w-4 opacity-70" />
                  {student.phone}
                </div>
                <div className="flex items-center text-slate-600">
                  <Mail className="mr-3 h-4 w-4 opacity-70" />
                  {student.email || 'Not provided'}
                </div>
                <div className="flex items-start text-slate-600">
                  <MapPin className="mr-3 h-4 w-4 opacity-70 mt-0.5 shrink-0" />
                  <span>{student.address || 'Not provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your contact details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={student.name} disabled />
                    <p className="text-xs text-muted-foreground">Contact admin to change your name.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue={student.phone} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={student.email || ''} placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Home Address</Label>
                    <Input id="address" defaultValue={student.address || ''} placeholder="123 Main St" />
                  </div>
                </div>
                <Button className="mt-4">Save Changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-500" /> Security
              </CardTitle>
              <CardDescription>Change your account password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input id="current_password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input id="new_password" type="password" />
                  </div>
                  <Button variant="outline" className="mt-2">Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
