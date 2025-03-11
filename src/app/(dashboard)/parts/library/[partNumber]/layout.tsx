"use client"

import { useEffect, useState } from "react";
import Image from 'next/image';
import BasicTopBar from "@/components/layouts/basic-top-bar";
import { getPartByPartNumber } from "@/lib/queries";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import { Prisma } from "@prisma/client";
import { Clipboard, File, Warehouse, Box } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

const PartDetailLayout = ({ 
    details, 
    manufacturing, 
    inventory 
}: { 
    details: React.ReactNode, 
    manufacturing: React.ReactNode, 
    inventory: React.ReactNode 
}) => {
    const params = useParams();
    const partNumber = params.partNumber as string;
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "details";

    const { data: part, isLoading } = useSWR(`/api/parts/${params.partNumber}`, () => getPartByPartNumber(partNumber));

    const tabs = [
        {
            label: "details",
            icon: <Clipboard />,
            href: `/parts/library/${params.partNumber}?tab=details`
        },
        {
            label: "manufacturing",
            icon: <Warehouse />,
            href: `/parts/library/${params.partNumber}?tab=manufacturing`
        },
        {
            label: "inventory",
            icon: <Box />,
            href: `/parts/library/${params.partNumber}?tab=inventory`
        }
    ]

    console.log(part);

    return (
        <div className="h-full bg-zinc-50 dark:bg-zinc-900">
            <BasicTopBar />
            <div className="sticky top-0 z-10 h-12 border-b px-4 bg-white dark:bg-gray-900 flex justify-between gap-2 shrink-0 transition-[width,height] ease-linear">
                {isLoading ? (
                    <Skeleton className="my-2 w-60" />
                ) : (
                    <div className="flex items-center gap-2">
                        <h1 className="font-medium">{part?.description}</h1>
                    <h2 className="text-sm text-gray-500">| {partNumber}</h2>
                    {part?.partImage && (
                        <Image src={part.partImage.url} alt={part.description} width={100} height={100} />
                    )}
                    </div>
                )}
                <Tabs value={activeTab} className="flex items-center">
                    <TabsList size="sm">
                        {tabs.map((tab) => (
                            <Link href={tab.href} key={tab.label} className="flex items-center">
                                <TabsTrigger 
                                    size="sm"
                                    value={tab.label}
                                >   
                                    <div className="flex items-center h-3 w-3 mr-2">
                                        {tab.icon}
                                    </div>
                                    {tab.label.charAt(0).toUpperCase() + tab.label.slice(1)}
                                </TabsTrigger>
                            </Link>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
            {activeTab === "details" && details}
            {activeTab === "manufacturing" && manufacturing}
            {activeTab === "inventory" && inventory}
        </div>
    )
}

export default PartDetailLayout;