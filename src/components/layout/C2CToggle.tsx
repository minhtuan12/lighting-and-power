'use client'

import { Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export default function C2CToggle() {
    const t = useTranslations('c2c')
    const [isC2C, setIsC2C] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsC2C(window.location.host.startsWith('c2c.'))
        }
    }, [])

    const handleToggle = () => {
        const host = window.location.host
        if (host.startsWith('c2c.')) {
            window.location.href = window.location.protocol + '//' + host.replace('c2c.', '')
        } else {
            window.location.href = window.location.protocol + '//c2c.' + host
        }
    }
    
    return (
        <div 
            onClick={handleToggle} 
            className="flex items-center gap-2 cursor-pointer font-bold text-[var(--primary)] hover:opacity-80 transition-opacity"
        >
            <Store size={22} />
            <span className="uppercase text-[15px]">
                {isC2C ? t('backToShop') : t('toCommunityStore')}
            </span>
        </div>
    )
}
