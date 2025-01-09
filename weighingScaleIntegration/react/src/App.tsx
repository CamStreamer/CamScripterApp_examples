import { appInfo } from './appInfo';
import { useState } from 'react';
import { Box, Typography, Divider, Link } from '@mui/material';
import Container from '@mui/material/Container';
import styled from '@mui/material/styles/styled';
import CssBaseline from '@mui/material/CssBaseline';

import { Nav } from './components/Nav';
import { ContainerLoader } from './components/ContainerLoader';
import { TAppSchema, applicationSchema } from './models/schema';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';
import { ZodError } from 'zod';
import { useSnackbar } from './hooks/useSnackbar';
import { Headline } from './components/Title';
import { FormWrapper } from './Form/FormWrapper';
import { mockedSettings } from './models/mock';

document.title = appInfo.title;

export const App = () => {
    const { displaySnackbar } = useSnackbar();

    const [defaultValues, setDefaultValues] = useState<TAppSchema | null>(null);

    useInitializeOnMount(async () => {
        let response: Response;
        try {
            let url = BASE_URL;
            if (process.env!.NODE_ENV === 'development') {
                url = 'http://localhost:52520' + url;
            }

            response = await fetch(url);
            const parsedData = applicationSchema.parse(await response.json());
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
                        <Headline text={appInfo.headline} />
                        <Typography>
                            Integration of the G&G E6000YA electronic scale together with the Lantronix UDS2100
                            RS232/485/422 or USR-TCP232-302 converter. The USR-TCP232-302 converter should be configured
                            as a TCP server with a baud rate of 9600 and the local port set to 10001 using{' '}
                            <Link
                                href="https://drive.google.com/file/d/10qNg4X8wJw_nVKvuYLcnGuRdiBB-M143/view"
                                target="_blank"
                                rel="noreferrer"
                            >
                                this
                            </Link>{' '}
                            app (click the Search Device button, select the found device, and edit its details).
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

const BASE_URL = appInfo.getGetUrl();
