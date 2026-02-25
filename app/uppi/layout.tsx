import React from "react"

export default function UppiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth check is handled by middleware
  return <>{children}</>
}
