import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, MapPin } from "lucide-react"
import { bookCabin } from "../actions"

export default async function CabinBookingPage() {
  const { student } = await requireStudent()

  // Fetch all active cabins
  const cabins = await db.cabin.findMany({
    where: { status: "active" },
    orderBy: [{ floor: "asc" }, { cabinNum: "asc" }]
  })

  // Filter out cabins the student has already booked
  const bookedCabinIds = student.bookings.filter(b => b.status !== "completed").map(b => b.cabinId)
  const availableCabins = cabins.filter(c => !bookedCabinIds.includes(c.id))

  // Group by floor
  const floors = availableCabins.reduce((acc, cabin) => {
    if (!acc[cabin.floor]) acc[cabin.floor] = []
    acc[cabin.floor].push(cabin)
    return acc
  }, {} as Record<number, typeof availableCabins>)

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/cabins" className="rounded-full p-2 hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Book a Study Cabin</h1>
          <p className="text-gray-500">Select a cabin to reserve your quiet space.</p>
        </div>
      </div>

      <div className="space-y-8">
        {Object.keys(floors).length > 0 ? (
          Object.entries(floors).map(([floor, floorCabins]) => (
            <div key={floor} className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Floor {floor}</h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {floorCabins.map(cabin => (
                  <div key={cabin.id} className="flex flex-col rounded-lg border p-4 hover:border-emerald-500 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-100 p-2">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="font-semibold">Cabin {cabin.cabinNum}</span>
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <form action={async () => {
                        "use server"
                        await bookCabin(cabin.id, 'reserved', new Date().toISOString().split('T')[0])
                      }}>
                        <button
                          type="submit"
                          className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                        >
                          Book (1 Month)
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
            No cabins are currently available for booking.
          </div>
        )}
      </div>
    </div>
  )
}
