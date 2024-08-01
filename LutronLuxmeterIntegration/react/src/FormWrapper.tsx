import { FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { TServerData, TServerConvertedData, TCameraServer, serverDataSchema } from './models/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from './hooks/Snackbar';
import { Form } from './Form/Form';
import styled from '@emotion/styled';
import { CircularProgress, Typography, Fab } from '@mui/material';
import { InfoSnackbar } from './components/Snackbar';

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

    const convert = (toPost: TServerData) => {
        const out: TServerConvertedData = {
            cameras: new Array<TCameraServer>(),
            widget: toPost.widget,
            luxmeter: toPost.luxmeter,
            events: toPost.events,
            acs: {
                enabled: toPost.acs.enabled,
                tls: toPost.acs.protocol !== 'http',
                tlsInsecure: toPost.acs.protocol === 'https_insecure',
                ip: toPost.acs.ip,
                port: toPost.acs.port,
                user: toPost.acs.user,
                pass: toPost.acs.pass,
                source_key: toPost.acs.source_key,
            },
        };

        out.widget.scale /= 100;
        out.luxmeter.frequency *= 1000;

        for (const camera of toPost.cameras) {
            out.cameras.push({
                tls: camera.protocol !== 'http',
                tlsInsecure: camera.protocol === 'https_insecure',
                ip: camera.ip,
                port: camera.port,
                user: camera.user,
                pass: camera.pass,
            });
        }

        console.log(out);
        return out;
    };
    const onSubmit: SubmitHandler<TServerData> = async (toPost) => {
        for (const camera of toPost.cameras) {
            if (camera.user === '' || camera.pass === '') {
                displaySnackbar({
                    type: 'error',
                    message: 'Please fill in credentials for the media source.',
                });
                return;
            }
        }

        try {
            let url = '/local/camscripter/package/settings.cgi?package_name=lutron_luxmeter_integration&action=set';
            if (process.env!.NODE_ENV === 'development') {
                url = 'http://localhost:52520' + url;
            }
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(convert(toPost)),
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
            <Form control={form.control} />
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
