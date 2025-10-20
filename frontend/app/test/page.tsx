import { AvatarEmblem } from "@/components/ui/avatar-emblem";
import { Card } from "@/components/ui/card";


export default function TestPage() {
    return (
        <div>
            <div className="h-[100dvh] flex justify-center items-center min-w-2xl max-2xl bg-gradient-to-b from-background to-secondary-background">
                <Card className="p-20 shadow-lg min-w-2xl bg-secondary border-white relative z-[999] max-w-2xl grid grid-cols-2 gap-20">
                    <AvatarEmblem
                        rank="bronze"
                        profile_picture="/juno.jpg"
                        size="lg"
                    />
                    <AvatarEmblem
                        rank="silver"
                        profile_picture="/juno.jpg"
                        size="lg"
                    />
                    <AvatarEmblem
                        rank="gold"
                        profile_picture="/juno.jpg"
                        size="lg"
                    />
                    <AvatarEmblem
                        rank="diamond"
                        profile_picture="/juno.jpg"
                        size="lg"
                    />
                    <AvatarEmblem
                        rank="master"
                        profile_picture="/juno.jpg"
                        size="lg"
                    />
                    <AvatarEmblem
                        rank="champion"
                        profile_picture="/juno.jpg"
                        size="lg"
                        championRank={67}
                    />
                </Card>
            </div>
        </div>
    )
}