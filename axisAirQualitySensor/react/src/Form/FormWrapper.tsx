import { FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { TServerData, serverDataSchema } from '../models/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from '../hooks/useSnackbar';
import { Form } from './Form';
import styled from '@emotion/styled';
import { CircularProgress, Typography, Fab } from '@mui/material';
import { InfoSnackbar } from '../components/Snackbar';

type Props = {
    defaultValues: TServerData;
};

export const FormWrapper = ({ defaultValues }: Props) => {
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();
    const form = useForm<TServerData>({
        resolver: zodResolver(serverDataSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues,
    });

    const onSubmit: SubmitHandler<TServerData> = async (toPost) => {
        if (toPost.camera.user === '' || toPost.camera.pass === '') {
            displaySnackbar({
                type: 'error',
                message: 'Please fill in credentials for the media source.',
            });
            return;
        }

        try {
            let url = '/local/camscripter/package/settings.cgi?package_name=video_checkpoint&action=set';
            if (process.env!.NODE_ENV === 'development') {
                url = 'http://localhost:52520' + url;
            }
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(toPost),
            });
            if (!res.ok) {
                throw new Error(`${res.status}: ${res.statusText}`);
            }

            displaySnackbar({
                type: 'success',
                message: 'Settings successfully saved.',
            });
        } catch (e) {
            console.error('Error while submitting data: ', e);
            displaySnackbar({
                type: 'error',
                message: 'Error saving settings.',
            });
        }
    };

    const onError: SubmitErrorHandler<TServerData> = (errors) => {
        console.error(`FORM ERROR: ${JSON.stringify(errors)}`);
        displaySnackbar({
            type: 'error',
            message: 'Error submitting the form.',
        });
    };

    return (
        <FormProvider {...form}>
            <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />
            <Form />
            <StyledFab
                color="info"
                variant="extended"
                disabled={form.formState.isSubmitting}
                onClick={form.handleSubmit(onSubmit, onError)}
            >
                {form.formState.isSubmitting ? <CircularProgress size={20} /> : <Typography>Save changes</Typography>}
            </StyledFab>
        </FormProvider>
    );
};

const StyledFab = styled(Fab)`
    position: -webkit-sticky;
    position: sticky;
    bottom: 20px;
    left: 74%;
    width: min-content;
    white-space: nowrap;
`;
