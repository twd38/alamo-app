"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQueryState } from 'nuqs'

// Sample data for housing plans
const housingPlans = [
  {
    id: 2,
    name: "Modern Duplex",
    image: "https://pub-d17172a416754e0185595c0afbba34ef.r2.dev/duplex_2unit.png",
    zoningTypes: ["SF-3", "SF-4"],
    area: "5,000 sqft",
    units: 2,
    category: "single-family",
  },
  {
    id: 1,
    name: "Duplex + Back House",
    image: "https://pub-d17172a416754e0185595c0afbba34ef.r2.dev/combined_3unit.png",
    zoningTypes: ["SF-3", "SF-4"],
    area: "8,310 sqft",
    units: 3,
    category: "custom",
  },
  {
    id: 3,
    name: "Stacked Flats Triplex",
    image: "https://pub-d17172a416754e0185595c0afbba34ef.r2.dev/stacked_triplex.png",
    zoningTypes: ["MU", "C-2"],
    area: "2,000 sqft",
    units: 3,
    category: "multi-family",
  },
  {
    id: 4,
    name: "Row House",
    image: "https://pub-d17172a416754e0185595c0afbba34ef.r2.dev/rowhouses_4.png",
    zoningTypes: ["R-1"],
    area: "4,000 sqft",
    units: 4,
    category: "single-family",
  },
  {
    id: 5,
    name: "8-Unit Point Access",
    image: "https://pub-d17172a416754e0185595c0afbba34ef.r2.dev/point_access_8unit.png",
    zoningTypes: ["R-3", "MU"],
    area: "2,000 sqft",
    units: 8,
    category: "multi-family",
  },
  {
    id: 6,
    name: "12-Unit Point Access",
    image: "https://pub-d17172a416754e0185595c0afbba34ef.r2.dev/point_access_12unit.png",
    zoningTypes: ["R-1"],
    area: "2,400 sq ft",
    units: 12,
    category: "multi-family",
  },
  {
    id: 7,
    name: "Large Point Access",
    image: "https://pub-d17172a416754e0185595c0afbba34ef.r2.dev/point_access_large.png",
    zoningTypes: ["MU", "C-1"],
    area: "5,000 sq ft",
    units: 24,
    category: "multi-family",
  },
]

// Categories for the sidebar
const categories = [
  { id: "all", name: "All plans", count: housingPlans.length },
  {
    id: "single-family",
    name: "Single family",
    count: housingPlans.filter((p) => p.category === "single-family").length,
  },
  { id: "multi-family", name: "Multi-family", count: housingPlans.filter((p) => p.category === "multi-family").length },
  { id: "custom", name: "Custom designs", count: 0 },
]

export default function DevelopmentPlansModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [developmentPlan, setDevelopmentPlan] = useQueryState('developmentPlan')
  // Filter plans based on search query and active category
  const filteredPlans = housingPlans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || plan.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handlePlanClick = (planId: number) => {
    setDevelopmentPlan(planId.toString())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] p-0">
        <div className="flex h-[80vh]">
          {/* Sidebar */}
          <div className="w-[250px] border-r p-4 bg-muted/30  ">
            {/* <h3 className="font-medium text-lg mb-4">Housing plans</h3> */}
            <DialogHeader>
              <DialogTitle className="text-xl pb-8">Development Plans</DialogTitle>
            </DialogHeader>
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md flex justify-between items-center ${
                      activeCategory === category.id ? "bg-muted font-medium" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    <span>{category.name}</span>
                    <span className="text-muted-foreground text-sm">{category.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b">
              <div className="relative w-1/2">
                <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Plans grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg hover:shadow-md transition-shadow">
                    <div className="relative aspect-square w-full">
                      <Image src={plan.image || "/placeholder.svg"} alt={plan.name} fill className="object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-lg">{plan.name}</h3>
                      <div className="mt-2 space-y-2">
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <div className="flex w-full justify-between">
                            <span>Units:</span>
                            <span>{plan.units}</span>
                          </div>
                          <div className="flex w-full justify-between">
                            <span>Area:</span>
                            <span>{plan.area}</span>
                          </div>
                          <div className="flex w-full justify-between">
                            <span>Zoning Types:</span>
                            <span>{plan.zoningTypes.join(", ")}</span>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full mt-4" onClick={() => handlePlanClick(plan.id)}>Find Parcels</Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPlans.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No housing plans found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
