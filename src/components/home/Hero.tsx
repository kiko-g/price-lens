import { AppDemo } from "@/components/home/AppDemo"
import { PhoneFrame } from "@/components/home/PhoneFrame"
import { BackgroundIllustration } from "@/components/home/BackgroundIllustration"

export function Hero() {
  return (
    <div className="flex p-20">
      <div className="-mx-4 h-[248px] px-9 [mask-image:linear-gradient(to_bottom,white_60%,transparent)] sm:mx-0 lg:absolute lg:-inset-x-10 lg:-bottom-20 lg:-top-10 lg:h-auto lg:px-0 lg:pt-10 xl:-bottom-32">
        <PhoneFrame className="my-24 ml-auto mr-36 flex max-w-[300px]" priority>
          <AppDemo />
        </PhoneFrame>
      </div>
    </div>
  )
}
