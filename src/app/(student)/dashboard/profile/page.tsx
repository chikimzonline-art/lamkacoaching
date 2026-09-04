import { requireStudent } from "@/lib/student-auth";
import { User, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card";
import { PersonalInfoForm } from "@/components/profile/personal-info-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import DigitalIdCard from "@/components/profile/digital-id-card";

export default async function DashboardProfilePage() {
  const { student } = await requireStudent();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Hero Banner with Avatar Upload & Student Identifiers */}
      <ProfileHero student={student} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Digital ID Pass & Account Overview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital Student ID Card Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪪</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Digital Student ID</h3>
                  <p className="text-[11px] text-slate-400">Scan attendance pass</p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Tap to flip
              </span>
            </div>

            <DigitalIdCard
              student={{
                id: student.id,
                name: student.name,
                phone: student.phone,
                email: student.email,
                address: student.address,
                avatar: student.avatar,
                username: student.username,
              }}
            />
          </div>

          {/* Account Overview & Summary Card */}
          <ProfileSummaryCard student={student} />
        </div>

        {/* Right Column: Interactive Management Tabs */}
        <div className="lg:col-span-7">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1.5 h-12 bg-slate-100/90 rounded-2xl mb-6 border border-slate-200/60">
              <TabsTrigger
                value="personal"
                className="rounded-xl font-semibold text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <User className="h-4 w-4" />
                <span>Personal Details</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-xl font-semibold text-xs sm:text-sm py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <Shield className="h-4 w-4" />
                <span>Security & Password</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6 focus-visible:outline-none">
              <PersonalInfoForm student={student} />
            </TabsContent>

            <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
              <ChangePasswordForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
