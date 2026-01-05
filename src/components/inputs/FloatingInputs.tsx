'use client'

import { Cascader, Input, InputNumber, Select, TreeSelect } from 'antd';
import { CascaderProps } from 'antd/es/cascader';
import { InputProps, TextAreaProps } from 'antd/es/input';
import { InputNumberProps } from 'antd/es/input-number';
import { SelectProps } from 'antd/es/select';
import { TreeSelectProps } from 'antd/es/tree-select';
import { memo, ReactNode, useState } from 'react';
import styles from './FloatingInputs.module.css';

interface FloatingLabelProps {
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
    containerClassName?: string;
    isFocused?: boolean;
    hasValue?: boolean;
}

const FloatingLabelWrapper = ({
    label,
    error,
    required,
    children,
    containerClassName = '',
    isFocused = false,
    hasValue = false,
}: FloatingLabelProps) => {
    const isActive = isFocused || hasValue;

    return (
        <div className={`${styles.floatingWrapper} ${containerClassName}`}>
            <div className={`${styles.inputContainer} ${isActive ? styles.active : ''}`}>
                {children}
                <label className={`${styles.floatingLabel} ${error ? styles.error : ''}`}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            </div>
            {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
    );
};

// ==================== FloatingInput ====================
interface FloatingInputProps extends InputProps {
    label: string;
    error?: string;
    required?: boolean;
    containerClassName?: string;
}

export const FloatingInput = memo(({
    label,
    error,
    required,
    containerClassName,
    placeholder = ' ',
    ...props
}: FloatingInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== null && props.value !== '';

    return (
        <FloatingLabelWrapper
            label={label}
            error={error}
            required={required}
            containerClassName={containerClassName}
            isFocused={isFocused}
            hasValue={hasValue}
        >
            <Input
                placeholder={placeholder}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                {...props}
            />
        </FloatingLabelWrapper>
    );
});

// ==================== FloatingTextArea ====================
interface FloatingTextAreaProps extends TextAreaProps {
    label: string;
    error?: string;
    required?: boolean;
    containerClassName?: string;
}

export const FloatingTextArea = memo(({
    label,
    error,
    required,
    containerClassName,
    placeholder = ' ',
    ...props
}: FloatingTextAreaProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== null && props.value !== '';

    return (
        <FloatingLabelWrapper
            label={label}
            error={error}
            required={required}
            containerClassName={containerClassName}
            isFocused={isFocused}
            hasValue={hasValue}
        >
            <Input.TextArea
                placeholder={placeholder}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                {...props}
            />
        </FloatingLabelWrapper>
    );
});

// ==================== FloatingInputNumber ====================
interface FloatingInputNumberProps extends InputNumberProps {
    label: string;
    error?: string;
    required?: boolean;
    containerClassName?: string;
}

export const FloatingInputNumber = memo(({
    label,
    error,
    required,
    containerClassName,
    placeholder = ' ',
    ...props
}: FloatingInputNumberProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== null && props.value !== '';

    return (
        <FloatingLabelWrapper
            label={label}
            error={error}
            required={required}
            containerClassName={containerClassName}
            isFocused={isFocused}
            hasValue={hasValue}
        >
            <InputNumber
                placeholder={placeholder}
                onFocus={(e) => {
                    setIsFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setIsFocused(false);
                    props.onBlur?.(e);
                }}
                className={styles.fullWidth}
                {...props}
            />
        </FloatingLabelWrapper>
    );
});

// ==================== FloatingSelect ====================
interface FloatingSelectProps extends SelectProps {
    label: string;
    error?: string;
    required?: boolean;
    containerClassName?: string;
}

export const FloatingSelect = ({
    label,
    error,
    required,
    containerClassName,
    ...props
}: FloatingSelectProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== null && props.value !== '';

    return (
        <FloatingLabelWrapper
            label={label}
            error={error}
            required={required}
            containerClassName={containerClassName}
            isFocused={isFocused}
            hasValue={hasValue}
        >
            <Select
                {...props}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={styles.fullWidth}
            />
        </FloatingLabelWrapper>
    );
};

// ==================== FloatingCascader ====================
interface FloatingCascaderProps extends CascaderProps {
    label: string;
    error?: string;
    required?: boolean;
    containerClassName?: string;
}

export const FloatingCascader = ({
    label,
    error,
    required,
    containerClassName,
    placeholder = ' ',
    disabled = false,
    ...props
}: FloatingCascaderProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value && (Array.isArray(props.value) ? props.value.length > 0 : true);
    const isActive = isFocused || hasValue;
    const containerClasses = [
        styles.inputContainer,
        isActive && styles.active,
        error && styles.hasError,
        disabled && styles.disabled,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={`${styles.floatingWrapper} ${containerClassName}`}>
            <div className={containerClasses}>
                <label className={`${styles.floatingLabel} ${error ? styles.error : ''}`}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
                <Cascader
                    placeholder={placeholder}
                    disabled={disabled}
                    {...(props.multiple === true
                        ? props
                        : (() => {
                            const { multiple, ...rest } = props;
                            return rest;
                        })()
                    )}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={styles.fullWidth}
                    style={{ border: 'none', padding: 0 }}
                    size='small'
                />
            </div>
            {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
    );
};

// ==================== FloatingTreeSelect ====================
interface FloatingTreeSelectProps extends TreeSelectProps {
    label: string;
    error?: string;
    required?: boolean;
    containerClassName?: string;
}

export const FloatingTreeSelect = memo(({
    label,
    error,
    required,
    containerClassName,
    placeholder = ' ',
    ...props
}: FloatingTreeSelectProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== null && props.value !== '';

    return (
        <FloatingLabelWrapper
            label={label}
            error={error}
            required={required}
            containerClassName={containerClassName}
            isFocused={isFocused}
            hasValue={hasValue}
        >
            <TreeSelect
                placeholder={placeholder}
                {...props}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={styles.fullWidth}
            />
        </FloatingLabelWrapper>
    );
});
