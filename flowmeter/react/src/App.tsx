import { useState } from 'react';
import { Box, Container, CssBaseline, Typography, Divider } from '@mui/material';
import styled from '@mui/material/styles/styled';

import { Nav } from './components/Nav';
import { ContainerLoader } from './components/ContainerLoader';
import { TSettings, settingsSchema } from './models/schema';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';
import { ZodError } from 'zod';
import { useSnackbar } from './hooks/useSnackbar';
import { Headline } from './components/Title';
import { FormWrapper } from './Form/FormWrapper';
import { mockedSettings } from './models/mock';

export const App = () => {
    const { displaySnackbar } = useSnackbar();

    const [defaultValues, setDefaultValues] = useState<TSettings | null>(null);

    useInitializeOnMount(async () => {
        let response: Response;
        let data: TSettings;
        try {
            let url = '/local/camscripter/package/settings.cgi?package_name=flowmeter&action=get';
            if (process.env!.NODE_ENV === 'development') {
                url = 'http://localhost:52520' + url;
            }

            response = await fetch(url);
            data = await response.json();
            const parsedData = settingsSchema.parse(data);
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
                        <Headline text={'Flow Meter'} />
                        <Typography>
                            This application integrates a flow meter supplied by Papouch — a custom version of their
                            Quido I/O module — with an Axis camera to display real-time volume data from a beer keg
                            overlaid directly in the video feed using the CamOverlay App. It uses a Raspberry Pi running
                            the CamScripter RPi micro-app to fetch flow measurements and send them to the camera. Ideal
                            for bars or events, it provides an engaging and informative view of liquid consumption.
                        </Typography>
                    </StyledHeader>
                    <Divider />
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
    background-color: white;

    & > div {
        flex: 1;
    }
`;

const StyledContentWrapper = styled(Box)`
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;

    & hr {
        width: calc(100% + 48px);

        @media (max-width: 600px) {
            width: calc(100% + 32px);
        }
    }
`;

const StyledHeader = styled(Box)`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20px 0;
    gap: 8px;
`;
