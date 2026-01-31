import { Icon } from "@/components/Icon";
import { Flex } from "antd";

export default function IntroductionCard({ text, icon }: { text: string; icon: any }) {
    return <Flex justify="space-between" align="center" className="border-[#000F8F] border rounded-[10px] !py-2 !px-4 bg-white w-full h-full">
        <div className="text-black font-semibold text-[15px]">{text}</div>
        <Icon src={icon} size={38} />
    </Flex>
}
