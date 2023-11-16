import { FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { TFormValues, TServerData, formSchema } from './models/schema';

import { BarcodeReaderSettings } from './components/BarcodeReaderSettings';
import { Button } from '@mui/material';
import { CamOverlayIntegration } from './components/CamOverlayIntegration';
import { CollapsibleFormContent } from './CollapsibleFormContent';
import { InfoSnackbar } from '../components/Snackbar';
import { LedSettingsSection } from './components/LedSettingsSection';
import React from 'react';
import { SharePointIntegrationSection } from './components/SharePointIntegrationSection';
import Typography from '@mui/material/Typography';
import styled from 'styled-components';
import { useSnackbar } from '../hooks/useSnackbar';
import { zodResolver } from '@hookform/resolvers/zod';

type Props = {
    defaultValues: TFormValues;
};

export const Form = ({ defaultValues }: Props) => {
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();

    const form = useForm<TFormValues>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues,
    });

    const onSubmit: SubmitHandler<TFormValues> = async (data) => {
        const serverData: TServerData = {
            camera: {
                protocol: data.protocol,
                ip: data.ip,
                port: data.port,
                user: data.user,
                pass: data.pass,
            },
            overlay: {
                alignment: data.alignment,
                height: data.height,
                width: data.width,
                scale: data.scale,
                x: data.x,
                y: data.y,
            },
            storage: {
                clientId: data.clientId,
                clientSecret: data.clientSecret,
                outputDir: data.outputDir,
                tenantId: data.tenantId,
                url: data.url,
                connectionTimeoutS: data.connectionTimeoutS || defaultValues.connectionTimeoutS,
                numberOfRetries: data.numberOfRetries || defaultValues.numberOfRetries,
                uploadTimeoutS: data.uploadTimeoutS || defaultValues.uploadTimeoutS,
            },
            leddSettings: {
                greenPort: data.greenPort,
                redPort: data.redPort,
            },
            barcodeSettings: {
                displayTimeS: data.displayTimeS,
            },
        };

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
                type: 'success',
                message: 'Settings successfully saved.',
            });
        } catch (e) {
            console.error('Error while submitting data: ', e);
            displaySnackbar({
                type: 'error',
                message: 'Error submitting data.',
            });
        }
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
                <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />
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
