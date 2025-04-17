"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ScenarioDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenario: {
    id: string
    name: string
    image?: string
    modelUrl?: string
    metrics: {
      zoningUsed: string
      grossBuiltArea: string
      floorAreaRatio: string
      netArea: string
      imperviousCoverageArea: string
      imperviousCoverageRatio: string
      buildingHeight: string
      buildingCoverageArea: string
      buildingCoverageRatio: string
      habitableFloorCount: number
      totalUnitCount: number
      unitDensityPerAcre: string
      averageUnitSize: string
      grossParkingCount: string
      parkingRatio: string
      developmentIncentives: string
      units: {
        totalSqft: string
        breakdown: {
          type: string
          sqft: string
          color: string
        }[]
      }
    }
  }
}

export function ScenarioDetail({ open, onOpenChange, scenario }: ScenarioDetailProps) {
  console.log(scenario);
  if (!scenario) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scenario.name} Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="massing">Massing</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="h-64">
              {/* {scenario.modelUrl && <ModelViewer modelUrl={scenario.modelUrl} className="w-full h-64" />} */}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Development Summary</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="text-gray-600">Zoning</div>
                  <div>{scenario.metrics.zoningUsed}</div>

                  <div className="text-gray-600">Total Units</div>
                  <div>{scenario.metrics.totalUnitCount}</div>

                  <div className="text-gray-600">Density</div>
                  <div>{scenario.metrics.unitDensityPerAcre}</div>

                  <div className="text-gray-600">Building Height</div>
                  <div>{scenario.metrics.buildingHeight}</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Unit Breakdown</h3>
                <div className="text-sm">
                  <p>Total Area: {scenario.metrics.units.totalSqft}</p>
                  <p className="mt-2">Primary Unit Type: {scenario.metrics.units.breakdown[0].type}</p>
                  <p>Size: {scenario.metrics.units.breakdown[0].sqft}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="massing">
            <div className="h-96 flex items-center justify-center bg-gray-100 rounded">
              {scenario.image ? (
                <img
                  src={scenario.image}
                  alt={`${scenario.name} massing`}
                  className="object-contain w-full h-96 rounded"
                />
              ) : (
                <div className="text-gray-400 text-lg">No image available</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="py-2 border-b">
                <div className="text-gray-600">Zoning Used</div>
                <div className="font-medium">{scenario.metrics.zoningUsed}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Gross Built Area</div>
                <div className="font-medium">{scenario.metrics.grossBuiltArea}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Floor Area Ratio</div>
                <div className="font-medium">{scenario.metrics.floorAreaRatio}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Net Area</div>
                <div className="font-medium">{scenario.metrics.netArea}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Impervious Coverage Area</div>
                <div className="font-medium">{scenario.metrics.imperviousCoverageArea}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Impervious Coverage Ratio</div>
                <div className="font-medium">{scenario.metrics.imperviousCoverageRatio}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Building Height</div>
                <div className="font-medium">{scenario.metrics.buildingHeight}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Building Coverage Area</div>
                <div className="font-medium">{scenario.metrics.buildingCoverageArea}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Building Coverage Ratio</div>
                <div className="font-medium">{scenario.metrics.buildingCoverageRatio}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Habitable Floor Count</div>
                <div className="font-medium">{scenario.metrics.habitableFloorCount}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Total Unit Count</div>
                <div className="font-medium">{scenario.metrics.totalUnitCount}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Unit Density Per Acre</div>
                <div className="font-medium">{scenario.metrics.unitDensityPerAcre}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Average Unit Size</div>
                <div className="font-medium">{scenario.metrics.averageUnitSize}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Gross Parking Count</div>
                <div className="font-medium">{scenario.metrics.grossParkingCount}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Parking Ratio</div>
                <div className="font-medium">{scenario.metrics.parkingRatio}</div>
              </div>
              <div className="py-2 border-b">
                <div className="text-gray-600">Development Incentives</div>
                <div className="font-medium">{scenario.metrics.developmentIncentives}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financials">
            <div className="text-center py-12 text-gray-500">Financial analysis would be displayed here</div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>Export Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
