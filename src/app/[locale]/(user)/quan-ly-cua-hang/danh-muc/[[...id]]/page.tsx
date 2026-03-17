"use client"

import SearchBar from "@/components/SearchBar"
import TableRowAction from "@/components/TableRowActions"
import { PAGE_LIMIT } from "@/constants/common"
import { routes } from "@/constants/routes"
import { useBoothCategories } from "@/hooks/user/use-booth-categories"
import useDebounce from "@/hooks/use-debounce"
import { showMessage } from "@/hooks/use-message"
import { filterAtom, selectedCategoryAtom } from "@/stores/category"
import { breadcrumbAtom } from "@/stores/ui"
import { ICategory } from "@/types/category"
import { LoadingOutlined } from "@ant-design/icons"
import {
    Badge,
    Button,
    Card,
    Flex,
    Image,
    Select,
    Space,
    Switch,
    Table,
} from "antd"
import { useAtom, useSetAtom } from "jotai"
import { ChevronLeft, Filter, Plus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

const { Option } = Select

const statusConfig = {
    active: {
        containerClass: "bg-green-50 text-green-700",
        text: "Hiá»‡n",
    },
    inactive: {
        containerClass: "bg-gray-100 text-gray-700",
        text: "áº¨n",
    },
}
const childrenBadgeColors = ["#cacaca", "cyan", "geekblue"]

const BoothCategoryPage = () => {
    const [searchText, setSearchText] = useState("")
    const [selectedCategory, setSelectedCategory] =
        useAtom(selectedCategoryAtom)
    const [filter, setFilter] = useAtom(filterAtom)
    const setBreadcrumb = useSetAtom(breadcrumbAtom)
    const router = useRouter()
    const params = useParams()

    const currentParentId = Array.isArray(params.id)
        ? params.id[params.id.length - 1]
        : params.id

    const cleanedFilter = Object.fromEntries(
        Object.entries(filter as any).filter(
            ([_, value]) =>
                value !== undefined && value !== null && value !== "",
        ),
    )

    const apiFilter = {
        view: "list",
        ...cleanedFilter,
        ...(currentParentId && { parentId: currentParentId }),
    }

    const {
        categories: data,
        isLoading,
        updateCategory,
        isUpdating,
        deleteCategoryAsync,
        isDeleting,
        deleteError,
    } = useBoothCategories(apiFilter)

    const handleUpdateStatus = (status: boolean, record: ICategory) => {
        if (record._id) {
            setSelectedCategory(record)
            updateCategory(
                {
                    id: String(record._id),
                    data: { ...record, isActive: status },
                },
                {
                    onSuccess() {
                        showMessage.success("Cáº­p nháº­t thÃ nh cÃ´ng")
                    },
                    onError() {
                        showMessage.error("ÄÃ£ cÃ³ lá»—i xáº£y ra")
                    },
                },
            )
        }
    }

    const handleDelete = async (record: ICategory) => {
        if (record._id) {
            await deleteCategoryAsync(record._id)
            if (!deleteError) {
                showMessage.success("XÃ³a thÃ nh cÃ´ng")
            } else {
                showMessage.error("ÄÃ£ cÃ³ lá»—i xáº£y ra")
            }
        }
    }

    const columns = useMemo(
        () => [
            {
                title: "áº¢nh",
                dataIndex: "image",
                key: "image",
                width: 100,
                align: "center",
                render: (image: string) => (
                    <Space size={12} align="center">
                        {image && (
                            <Image
                                preview={false}
                                style={{
                                    borderRadius: 8,
                                    border: "#cac8c8 1px solid",
                                    marginTop: 2,
                                }}
                                src={image}
                                width={80}
                                height={50}
                            />
                        )}
                    </Space>
                ),
            },
            {
                title: "TÃªn danh má»¥c",
                dataIndex: "name",
                key: "name",
                width: 280,
                render: (text: string, record: ICategory) => (
                    <Space size={12}>
                        {record?.childrenCount && record.childrenCount > 0 ? (
                            <div
                                onClick={() => handleGoToChildTable(record._id)}
                                className="font-semibold text-gray-900 mb-0.5 cursor-pointer hover:opacity-70"
                            >
                                {text}
                            </div>
                        ) : (
                            <div className="font-semibold text-gray-700 mb-0.5">
                                {text}
                            </div>
                        )}
                    </Space>
                ),
            },
            {
                title: "Sá»‘ cáº¥p con",
                dataIndex: "children",
                key: "children",
                width: 280,
                align: "center" as const,
                render: (text: string, record: ICategory) => (
                    <Space size={12}>
                        <Badge
                            showZero
                            count={record?.childrenCount || 0}
                            color={
                                childrenBadgeColors[
                                    Math.min(record?.childrenCount || 0, 2)
                                ]
                            }
                        />
                    </Space>
                ),
            },
            {
                title: "Tráº¡ng thÃ¡i",
                dataIndex: "isActive",
                key: "isActive",
                align: "center" as const,
                width: 120,
                render: (text: boolean, record: ICategory) => {
                    const config = statusConfig[text ? "active" : "inactive"]
                    return (
                        <Switch
                            loading={
                                isUpdating &&
                                selectedCategory?._id === record._id
                            }
                            checkedChildren={config.text}
                            unCheckedChildren={config.text}
                            checked={text}
                            onChange={(e) => handleUpdateStatus(e, record)}
                            rootClassName={config.containerClass}
                        />
                    )
                },
            },
            {
                title: "",
                key: "action",
                width: 80,
                align: "center" as const,
                render: (_: any, record: ICategory) => (
                    <TableRowAction
                        record={record}
                        enableEdit
                        enableDelete
                        onClickEdit={() =>
                            router.push(
                                `${routes.boothCategory.url}/form?id=${record._id}`,
                            )
                        }
                        onClickDelete={() => handleDelete(record)}
                    />
                ),
            },
        ],
        [handleUpdateStatus, isUpdating, selectedCategory],
    )

    const filteredData = useMemo(() => {
        if (!data?.data) return []

        const allCategories = data.data as ICategory[]

        if (currentParentId) {
            return allCategories.filter(
                (c: ICategory) => c.parentId === currentParentId,
            )
        }

        return allCategories.filter((c: ICategory) => !c.parentId)
    }, [data, currentParentId])

    const handleGoToChildTable = useCallback(
        (parentId: string) => {
            setFilter((prev) => ({
                ...prev,
                isActive: undefined,
                search: "",
            }))
            router.push(`${routes.boothCategory.url}/${parentId}`)
            setSearchText("")
        },
        [router, setFilter],
    )

    const debounceSearch = useDebounce(
        (value: string) =>
            setFilter((prev) => ({ isActive: prev?.isActive, search: value })),
        400,
    )

    const handleSearch = useCallback(
        (value: string) => {
            setSearchText(value)
            debounceSearch(value)
        },
        [setSearchText, debounceSearch],
    )

    const handleBack = useCallback(() => {
        setFilter((prev) => ({
            ...prev,
            isActive: undefined,
            search: "",
        }))
        setSearchText("")
        router.back()
    }, [router, setFilter])

    useEffect(() => {
        setBreadcrumb([
            {
                key: routes.boothCategory.url,
                title: routes.boothCategory.title,
            },
        ])
    }, [setBreadcrumb])

    return (
        <Card
            variant="borderless"
            className="rounded-xl shadow-sm [&>.ant-card-body]:!pb-2"
        >
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div className="grid grid-cols-3 gap-6">
                        <Flex align="center" gap={20} className="col-span-2">
                            {currentParentId && (
                                <ChevronLeft
                                    className="cursor-pointer hover:text-blue-600"
                                    onClick={handleBack}
                                />
                            )}
                            <SearchBar
                                value={searchText}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="TÃ¬m theo tÃªn danh má»¥c"
                            />
                        </Flex>
                        <div className="flex items-center gap-6">
                            <Select
                                value={
                                    filter?.isActive !== undefined
                                        ? filter.isActive
                                            ? "active"
                                            : "inactive"
                                        : "all"
                                }
                                onChange={(e) =>
                                    setFilter({
                                        ...filter,
                                        isActive:
                                            e !== "all"
                                                ? e === "active"
                                                    ? true
                                                    : false
                                                : undefined,
                                    } as any)
                                }
                                className="w-45"
                                suffixIcon={<Filter size={16} />}
                            >
                                <Option value="all">Táº¥t cáº£ tráº¡ng thÃ¡i</Option>
                                <Option value="active">Hiá»‡n</Option>
                                <Option value="inactive">áº¨n</Option>
                            </Select>
                        </div>
                    </div>
                    <Space size={12}>
                        <Button
                            type="primary"
                            icon={<Plus size={16} />}
                            className="rounded-lg h-10 bg-blue-500 hover:bg-blue-600 font-semibold flex items-center"
                            onClick={() =>
                                router.push(`${routes.boothCategory.url}/form`)
                            }
                        >
                            ThÃªm má»›i
                        </Button>
                    </Space>
                </div>
            </div>

            <Table
                rowKey={"_id"}
                columns={columns as any}
                loading={{
                    indicator: <LoadingOutlined />,
                    spinning: isLoading || isDeleting,
                }}
                dataSource={filteredData}
                pagination={{
                    pageSize: PAGE_LIMIT,
                    showTotal: (total) => `Tá»•ng: ${total} danh má»¥c`,
                    className: "!mt-6 !px-6",
                }}
                className="custom-table rounded-lg"
                scroll={{ y: "calc(100vh - 320px)" }}
            />
        </Card>
    )
}

export default BoothCategoryPage
