import { Controller, FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { TFormValues, formSchema } from './models/schema';

import { CamOverlayIntegration } from './components/CamOverlayIntegration';
import { CollapsibleFormContent } from './CollapsibleFormContent';
import React from 'react';
import { SharePointIntegrationSection } from './components/SharePointIntegrationSection';
import { StyledFormValuesRow } from './HelperComponents';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { WithLabel } from './components/WithLabel';
import styled from 'styled-components';
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
            <StyledForm onSubmit={form.handleSubmit(onSubmit, onError)}>
                <CollapsibleFormContent
                    title="SharePoint intergation"
                    closedContent={
                        <Typography fontSize="0.875rem" color="#797979">
                            Set SharePoint service.
                        </Typography>
                    }
                >
                    <SharePointIntegrationSection />
                </CollapsibleFormContent>
                <CollapsibleFormContent
                    title="CamOverlay intergation"
                    closedContent={
                        <Typography fontSize="0.875rem" color="#797979">
                            Set remote camera and CamOverlay integration.
                        </Typography>
                    }
                    initialContentClosed
                >
                    <CamOverlayIntegration />
                </CollapsibleFormContent>
            </StyledForm>
        </FormProvider>
    );
};

export const StyledForm = styled.form`
    max-width: 700px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-block: 1.5rem;
`;
