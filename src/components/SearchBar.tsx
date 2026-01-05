import type { InputProps } from 'antd';
import { Input } from 'antd';

export default function SearchBar(props: InputProps) {
    return <Input {...props} className={`hover:border-[var(--ant-border-color)] ${props.className}`} />;
}
