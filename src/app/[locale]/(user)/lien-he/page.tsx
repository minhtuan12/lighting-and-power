import Loading from '@/components/Loading'
import VietMap from '@/components/VietMap'
import { getConfig } from '@/fetch-data/config'
import { IConfig } from '@/types/config'
import { Col, Divider, Flex, Row } from 'antd'
import { CalendarClock, Mail, MapPin, Phone } from 'lucide-react'
import Image from 'next/image'
import { Suspense } from 'react'
import ContactForm from '../(components)/(contact)/ContactForm'

const VIET_MAP_API_KEY = process.env.VIET_MAP_API_KEY!

function Contact({ data }: { data: IConfig }) {
	return <>
		<h3 className="text-left font-semibold text-2xl mb-1">
			Thông tin liên hệ
		</h3>
		<p className='text-[15px] font-normal'>Nếu bạn có bất kỳ câu hỏi nào, hãy thoải mái liên hệ với chúng tôi</p>
		<Divider />
		<Flex gap={14} className='!mb-6' align="center">
			<MapPin
				size={24}
				color="#ffffff"
				strokeWidth={2}
				absoluteStrokeWidth
				className="shrink-0"
			/>
			<div className="font-semibold text-[15px]">{data.address}</div>
		</Flex>
		<Flex gap={14} className='!mb-6' align="center">
			<Mail
				size={24}
				color="#ffffff"
				strokeWidth={2}
				absoluteStrokeWidth
			/>
			<div className="font-semibold text-[15px]">{data.email}</div>
		</Flex>
		<Flex gap={14} className='!mb-6' align="center">
			<Phone
				size={24}
				color="#ffffff"
				strokeWidth={2}
				absoluteStrokeWidth
			/>
			<div className="font-semibold text-[15px]">{data.hotline}</div>
		</Flex>
		{data.workingHours && (
			<Flex gap={14} align="center">
				<CalendarClock
					size={24}
					color="#ffffff"
					strokeWidth={2}
					absoluteStrokeWidth
				/>
				<div className="font-semibold text-[15px]">{data.workingHours}</div>
			</Flex>
		)}
	</>
}

export default async function () {
	const { data } = await getConfig()

	return (
		<Suspense fallback={<Loading />}>
			<Flex
				vertical
				gap={40}
				className="lg:!-mt-5 !mb-30"
			>
				<Image
					src={'/images/contact-banner.png'}
					alt={`Banner L&P Contact Us`}
					className="object-cover max-h-[372px]"
					priority
					width={1140}
					height={372}
				/>
				<div
					style={{
						borderRadius: 16,
						overflow: 'hidden',
						margin: '0 auto',
						boxShadow: '0 8px 40px rgba(0,0,0,0.13)',
						background: '#fff',
						width: '100%'
					}}
				>
					{/* Left Panel */}
					<Row>
						<Col span={10} style={{
							background: 'linear-gradient(135deg, #000F8F, #00C8FF)',
							color: '#fff',
							padding: '36px 80px 36px 36px',
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'space-between',
							position: 'relative',
							overflow: 'hidden',
							borderRadius: 16
						}}>

							<div style={{ position: 'relative', zIndex: 1 }}>
								<Contact data={data} />
							</div>
						</Col>
						<Col span={14}>
							{/* Right Panel */}
							<div style={{ flex: 1, padding: '36px 40px 30px 50px' }}>
								<ContactForm />
							</div>
						</Col>
					</Row>
				</div>
				<VietMap apiKey={VIET_MAP_API_KEY} />
			</Flex>
		</Suspense>
	)
}
