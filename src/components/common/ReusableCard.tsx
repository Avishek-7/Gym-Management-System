"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

type ReusableCardProps = {
  title: string
  description: string
  image: string
  buttonText?: string
  onButtonClick?: () => void
}

export default function ReusableCard({
  title,
  description,
  image,
  buttonText = "Learn More",
  onButtonClick,
}: ReusableCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="w-80"
    >
      <Card className="rounded-2xl shadow-md overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-40 w-full object-cover"
        />
        <CardContent className="p-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-gray-600 mt-2">{description}</p>
          <Button
            onClick={onButtonClick}
            className="mt-4 w-full rounded-xl"
          >
            {buttonText}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
