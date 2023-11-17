import { FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { TFormValues, formSchema } from './models/schema';

import { BarcodeReaderSettings } from './components/BarcodeReaderSettings';
import { Button } from '@mui/material';
import { CamOverlayIntegration } from './components/CamOverlayIntegration';
import { CollapsibleFormContent } from './CollapsibleFormContent';
import { LedSettingsSection } from './components/LedSettingsSection';
import React from 'react';
import { SharePointIntegrationSection } from './components/SharePointIntegrationSection';
import { TSnackBarData } from '../components/Snackbar';
import Typography from '@mui/material/Typography';
import { covertFlatFormDataIntoServerData } from '../utils';
import styled from 'styled-components';
import { zodResolver } from '@hookform/resolvers/zod';

type Props = {
    defaultValues: TFormValues;
    displaySnackbar: (val: TSnackBarData) => void;
};

export const Form = ({ defaultValues, displaySnackbar }: Props) => {
    const form = useForm<TFormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues,
    });

    const onSubmit: SubmitHandler<TFormValues> = async (data) => {
        displaySnackbar({
            id: 'isSubmittingInfo',
            type: 'info',
            message: 'Submitting...',
        });

        const serverData = covertFlatFormDataIntoServerData(data, defaultValues);

        try {
            const res = await fetch(
                '/local/camscripter/package/settings.cgi?package_name=barcodeReaderAndUploader&action=set',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(serverData),
                }
            );
            if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);

            displaySnackbar({
                id: 'settingsSavedSuccess',
                type: 'success',
                message: 'Settings successfully saved.',
            });
        } catch (e) {
            console.error('Error while submitting data: ', e);
            displaySnackbar({
                id: 'settingsSaveError',
                type: 'error',
                message: 'Error saving settings.',
            });
        }
    };

    const onError: SubmitErrorHandler<TFormValues> = (errors) => {
        console.error(`FORM ERROR: ${JSON.stringify(errors)}`);
        displaySnackbar({
            id: 'submitError',
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
                <CollapsibleFormContent
                    title="LED settings"
                    closedContent={
                        <Typography fontSize="0.875rem" color="#797979">
                            Set LED ports.
                        </Typography>
                    }
                    initialContentClosed
                >
                    <LedSettingsSection />
                </CollapsibleFormContent>
                <CollapsibleFormContent
                    title="Barcode reader"
                    closedContent={
                        <Typography fontSize="0.875rem" color="#797979">
                            Set barcode reader.
                        </Typography>
                    }
                    initialContentClosed
                >
                    <BarcodeReaderSettings />
                </CollapsibleFormContent>
                <StyledConfirmButton
                    type="submit"
                    variant="contained"
                    disabled={form.formState.isSubmitting || !form.formState.isValid}
                >
                    Submit
                </StyledConfirmButton>
            </StyledForm>
        </FormProvider>
    );
};

const StyledForm = styled.form`
    max-width: 700px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-block: 1.5rem;
`;

const StyledConfirmButton = styled(Button)`
    &.MuiButtonBase-root {
        font-size: 1rem;
        height: 56px; //same as inputs
    }
`;
