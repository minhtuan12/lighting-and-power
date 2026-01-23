import { Button, Dropdown, Popconfirm } from "antd";
import { Edit, Eye, MoreVertical, Trash2 } from "lucide-react";
import { useCallback } from "react";

interface IProps {
    record: any;
    items?: IRowActionItem[];
    enableView?: boolean;
    enableEdit?: boolean;
    enableDelete?: boolean;
    onClickView?: (record: any) => void;
    onClickEdit?: (record: any) => void;
    onClickDelete?: (record: any) => void;
}

interface IRowActionItem {
    key: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

export default function TableRowAction({
    record,
    items = [],
    enableDelete = false,
    enableEdit = false,
    enableView = false,
    onClickView,
    onClickEdit,
    onClickDelete,
}: IProps) {
    const getActionMenuItems = useCallback(() => [
        ...(enableView && onClickView) ? [
            {
                key: 'view',
                icon: <Eye size={16} />,
                label: 'View',
                onClick: () => onClickView(record),
            }
        ] : [],
        ...(enableEdit && onClickEdit) ? [
            {
                key: 'edit',
                icon: <Edit size={16} />,
                label: 'Sửa',
                onClick: () => onClickEdit(record),
            }
        ] : [],
        ...(enableDelete && onClickDelete) ? [
            {
                type: 'divider',
            },
            {
                key: 'delete',
                label: (
                    <Popconfirm
                        title="Xác nhận xóa"
                        description="Bạn có chắc chắn muốn xóa?"
                        okText="Xóa"
                        cancelText="Hủy"
                        onConfirm={() => onClickDelete(record)}
                    >
                        <div className="flex items-center gap-2">
                            <Trash2 size={16} />
                            <span>Xóa</span>
                        </div>
                    </Popconfirm>
                ),
                danger: true,
            }
        ] : [],
        ...items,
    ], [
        record,
        items,
        enableDelete,
        enableEdit,
        enableView,
        onClickView,
        onClickEdit,
        onClickDelete,
    ]);

    return <Dropdown
        menu={{ items: getActionMenuItems() as any }}
        trigger={['click']}
        placement="bottomRight"
    >
        <Button
            type="text"
            icon={<MoreVertical size={18} className="text-gray-500" />}
            className="w-8 h-8"
        />
    </Dropdown>
}
