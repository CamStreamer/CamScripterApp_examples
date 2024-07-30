import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import styled from '@mui/material/styles/styled';
import CssBaseline from '@mui/material/CssBaseline';

import { Nav } from './components/Nav';
import { ContainerLoader } from './components/ContainerLoader';
import { TServerData, TServerConvertedData, serverDataSchema } from './models/schema';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';
import { ZodError } from 'zod';
import { useSnackbar } from './hooks/Snackbar';
import { Typography } from '@mui/material';
import { Headline } from './components/Title';
import { FormWrapper } from './FormWrapper';
import { mockedSettings } from './models/mock';

export const App = () => {
    const { displaySnackbar } = useSnackbar();

    const [defaultValues, setDefaultValues] = useState<TServerData | null>(null);

    const convert = (fetched: TServerConvertedData) => {
        const out: TServerData = {
            cameras: new Array(),
            widget: fetched.widget,
            luxmeter: fetched.luxmeter,
            events: fetched.events,
            acs: {
                enabled: false,
                protocol: 'http',
                ip: '',
                port: 55756,
                user: '',
                pass: '',
                source_key: '',
            },
        };

        out.widget.scale *= 100;
        out.luxmeter.frequency /= 1000;

        for (const camera of fetched.cameras) {
            out.cameras.push({
                protocol: !camera.tls ? 'http' : camera.tlsInsecure ? 'https_insecure' : 'https',
                ip: camera.ip,
                port: camera.port,
                user: camera.user,
                pass: camera.pass,
            });
        }
        console.log(out);
        return out;
    };

    useInitializeOnMount(async () => {
        let response: Response;
        try {
            let url = '/local/camscripter/package/settings.cgi?package_name=lutron_luxmeter_integration&action=get';
            if (process.env!.NODE_ENV === 'development') {
                url = 'http://localhost:52520' + url;
            }

            response = await fetch(url);
            const data = convert(await response.json());
            const parsedData = serverDataSchema.parse(data);
            setDefaultValues(parsedData);
        } catch (e) {
            if (e instanceof ZodError) {
                displaySnackbar({
                    type: 'error',
                    message: 'Data from server do not match expected data',
                });
            } else {
                displaySnackbar({
                    type: 'error',
                    message: 'Error fetching form data.',
                });
            }

            console.error('Error while fetching default values: ', e);
            setDefaultValues(mockedSettings);
        }
    });

    return (
        <>
            <Nav />
            <StyledContainer>
                <CssBaseline />
                <StyledContentWrapper>
                    <StyledHeader>
                        <Headline text={'Lutron Luxmeter integration'} />
                        <Typography>
                            Clients in retail, warehousing, manufacturing are looking for a solution to retrieve data in
                            the form of relatively short text string from barcode reader, external IP source or even via
                            OCR, overlay the data on video stream and upload media content somewhere or push event to
                            VMS. See documentation here.
                        </Typography>
                    </StyledHeader>
                    {defaultValues ? (
                        <FormWrapper defaultValues={defaultValues} />
                    ) : (
                        <ContainerLoader size={80} infoText="Fetching settings..." />
                    )}
                </StyledContentWrapper>
            </StyledContainer>
        </>
    );
};

const StyledContainer = styled(Container)`
    width: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
    align-items: center;

    & > div {
        flex: 1;
    }
`;

const StyledContentWrapper = styled(Box)({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
});

const StyledHeader = styled(Box)`
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: white;
    padding: 16px;
    padding-bottom: 30px;
    gap: 8px;
`;
