import Image from "next/image"
import { cn } from "@/lib/utils"

import auchan from "@/images/brands/auchan.svg"
import continente from "@/images/brands/continente.svg"

export function Brands({ className }: { className?: string }) {
  const brands = [
    {
      name: "Continente",
      image: continente,
      disabled: false,
    },
    {
      name: "Auchan",
      image: auchan,
      disabled: true,
    },
  ]

  return (
    <div className={cn("grid grid-cols-3 gap-6 lg:grid-cols-5 lg:gap-8", className)}>
      {brands.map((brand) => (
        <Image
          key={brand.name}
          src={brand.image}
          alt={brand.name}
          width={300}
          height={300}
          className={cn("h-16 w-full object-contain", brand.disabled && "opacity-50 grayscale")}
        />
      ))}
    </div>
  )
}
