import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { Search, MapPin, DoorOpen } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { bookCabin } from "./actions"

export default async function ExploreCabinsPage() {
  const { student } = await requireStudent()

  // Fetch all active cabins
  const cabins = await db.cabin.findMany({
    where: { status: "active" },
    orderBy: [{ floor: "asc" }, { cabinNum: "asc" }]
  })

  // Filter out cabins the student has already booked
  const bookedCabinIds = student.bookings.filter(b => b.status !== "completed").map(b => b.cabinId)
  const availableCabins = cabins.filter(c => !bookedCabinIds.includes(c.id))

  // Extract unique floors from available cabins
  const floors = Array.from(new Set(availableCabins.map(c => c.floor))).sort((a, b) => a - b)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Explore Study Cabins</h1>
        <p className="text-muted-foreground mt-2">Find a quiet place to focus. Filter by floor to find available cabins.</p>
      </div>

      {availableCabins.length > 0 ? (
        <Tabs defaultValue="All" className="space-y-6">
          <TabsList className="bg-slate-100/50 p-1 rounded-xl h-auto flex-wrap justify-start gap-2">
            <TabsTrigger 
              value="All"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 font-medium"
            >
              All Floors
            </TabsTrigger>
            {floors.map(floor => (
              <TabsTrigger 
                key={floor} 
                value={String(floor)}
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 font-medium"
              >
                Floor {floor}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* "All" Tab Content */}
          <TabsContent value="All" className="focus-visible:outline-none focus-visible:ring-0">
             <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {availableCabins.map(cabin => (
                <CabinCard key={cabin.id} cabin={cabin} />
              ))}
            </div>
          </TabsContent>

          {/* Floor Tabs Content */}
          {floors.map(floor => {
            const floorCabins = availableCabins.filter(c => c.floor === floor)
            return (
              <TabsContent key={floor} value={String(floor)} className="focus-visible:outline-none focus-visible:ring-0">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {floorCabins.map(cabin => (
                     <CabinCard key={cabin.id} cabin={cabin} />
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      ) : (
        <div className="rounded-xl border border-dashed p-12 text-center text-gray-500 bg-slate-50">
          <Search className="h-8 w-8 mx-auto mb-3 text-slate-400" />
          <h3 className="text-lg font-medium text-gray-900">No Cabins Available</h3>
          <p className="mt-1">All cabins are currently occupied or you have already booked them.</p>
        </div>
      )}
    </div>
  )
}

function CabinCard({ cabin }: { cabin: any }) {
  return (
    <div className="flex flex-col rounded-lg border bg-white p-4 hover:border-teal-500 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-teal-100 p-2">
          <DoorOpen className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <span className="font-semibold block text-gray-900">Cabin {cabin.cabinNum}</span>
          <span className="text-xs text-gray-500">Floor {cabin.floor}</span>
        </div>
      </div>
      <div className="mt-4 border-t pt-4">
        <form action={async () => {
          "use server"
          await bookCabin(cabin.id, 1) // Default to 1 month for now
        }}>
          <button
            type="submit"
            className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
          >
            Book (1 Month)
          </button>
        </form>
      </div>
    </div>
  )
}
