import { LoadingOutlined } from "@ant-design/icons";
import { Spin, SpinProps } from "antd";

export default function Loading(props: SpinProps) {
    return <div className="w-full h-full flex items-center justify-center">
        <Spin indicator={<LoadingOutlined spin />} {...props} />
    </div>
}
