import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import styled from '@mui/material/styles/styled';
import CssBaseline from '@mui/material/CssBaseline';

import { Nav } from './components/Nav';
import { ContainerLoader } from './components/ContainerLoader';
import { TSettings, settingsSchema } from './models/schema';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';
import { ZodError } from 'zod';
import { useSnackbar } from './hooks/Snackbar';
import { Typography } from '@mui/material';
import { Headline } from './components/Title';
import { FormWrapper } from './FormWrapper';
import { mockedSettings } from './models/mock';

export const App = () => {
    const { displaySnackbar } = useSnackbar();

    const [defaultValues, setDefaultValues] = useState<TSettings | null>(null);

    useInitializeOnMount(async () => {
        let response: Response;
        try {
            let url = '/local/camscripter/package/settings.cgi?package_name=lutron_luxmeter_integration&action=get';
            if (process.env!.NODE_ENV === 'development') {
                url = 'http://localhost:52520' + url;
            }

            response = await fetch(url);
            const parsedData = settingsSchema.parse(await response.json());
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
                            Integration of Luxmeter Lutron LX 1180. Before using the device, select the unit range and
                            turn on the recording ti prevent the device from turning off. Set the USB stick to position
                            2.
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
    padding: 35px 16px 25px;
    gap: 8px;
`;
