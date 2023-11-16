import { FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { TFormValues, formSchema } from './models/schema';

import React from 'react';
import { useSnackbar } from '../hooks/useSnackbar';
import { zodResolver } from '@hookform/resolvers/zod';

type Props = {
    defaultValues: TFormValues;
};

export const Form = ({ defaultValues }: Props) => {
    const { displaySnackbar } = useSnackbar();

    const form = useForm<TFormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues,
    });

    const onSubmit: SubmitHandler<TFormValues> = (data) => {
        console.log(data);
    };

    const onError: SubmitErrorHandler<TFormValues> = (errors) => {
        console.error(`FORM ERROR: ${JSON.stringify(errors)}`);
        displaySnackbar({
            type: 'error',
            message: 'Error submitting the form.',
        });
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)}></form>
        </FormProvider>
    );
};
