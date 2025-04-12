"use client"

import type React from "react"
import { ArrowLeft, ArrowRight, Check, Share, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface PropertyDetail {
  label: string
  value: string | React.ReactNode
}

interface PropertyDetailProps {
  property: {
    address: string
    city: string
    state: string
    zip: string
    imageUrl: string
    summary: PropertyDetail[]
    parcelRecords: PropertyDetail[]
    // dimensions: PropertyDetail[]
    // overlays: PropertyDetail[]
    // appraisals: PropertyDetail[]
    // zoning: PropertyDetail[]
    // neighborhood: PropertyDetail[]
  }
  onClose: () => void
}

export function PropertyDetail({ property, onClose }: PropertyDetailProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-auto scrollbar-hide border-r bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          {property.address ? (
            <span className="">
              <span className="text-sm font-bold">
                {property.address}, {" "}
              </span>
              <span className="text-sm text-gray-500">
                {property.city}, {property.state} {property.zip}
              </span>
            </span>
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <div className="mb-4 overflow-hidden rounded-lg">
          <img
            src={property.imageUrl || "/placeholder.svg"}
            alt={`Property at ${property.address}`}
            className="h-auto w-full object-cover"
          />
        </div>

        {property.address ? (
          <div className="space-y-6">
            <Section title="Summary" items={property.summary} />
            <Section
            title="Parcel Records"
            items={property.parcelRecords}
            pagination={{
              current: 1,
              total: 1,
              onPrevious: () => {},
              onNext: () => {},
            }}
          />

          {/* <Section title="Dimensions" items={property.dimensions} />

          <Section
            title="Overlays"
            items={property.overlays}
            customValue={(item) =>
              item.label === "Overlays" && item.value === "None" ? (
                <div className="flex items-center gap-1">
                  <span>None</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check className="h-3 w-3" />
                  </span>
                </div>
              ) : (
                item.value
              )
            }
          />

          <Section title="Appraisals" items={property.appraisals} />

          <Section title="Zoning" items={property.zoning} />

          <Section title="Neighborhood" items={property.neighborhood} /> */}
        </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto border-t bg-white p-4">
        <Button className="w-full bg-blue-500 hover:bg-blue-600">Create project</Button>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  items: PropertyDetail[]
  pagination?: {
    current: number
    total: number
    onPrevious: () => void
    onNext: () => void
  }
  customValue?: (item: PropertyDetail) => React.ReactNode
}

function Section({ title, items, pagination, customValue }: SectionProps) {

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-medium">{title}</h2>
        {pagination && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <span className="text-sm text-gray-600">
              {pagination.current} of {pagination.total}
            </span>
            <Button variant="outline" size="icon" className="h-7 w-7">
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between py-1">
              <span className="text-sm text-gray-500">{item.label}</span>
              <div className="text-sm text-right">{customValue ? customValue(item) : item.value}</div>
            </div>
            {index < items.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  )
}



