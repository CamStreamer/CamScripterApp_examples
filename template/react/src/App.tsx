import { appInfo } from './appInfo';
import { useState } from 'react';
import { Box, Container, CssBaseline, Divider } from '@mui/material';
import styled from '@mui/material/styles/styled';

import { Nav } from './components/Nav';
import { ContainerLoader } from './components/ContainerLoader';
import { TSettings, settingsSchema } from './models/schema';
import { useInitializeOnMount } from './hooks/useInitializeOnMount';
import { ZodError } from 'zod';
import { useSnackbar } from './hooks/useSnackbar';
import { Headline } from './components/Title';
import { FormWrapper } from './FormWrapper';
import { mockedSettings } from './models/mock';

document.title = appInfo.title;

export const App = () => {
    const { displaySnackbar } = useSnackbar();

    const [defaultValues, setDefaultValues] = useState<TSettings | null>(null);

    useInitializeOnMount(async () => {
        let response: Response;
        try {
            let url = BASE_URL;
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
                        <Headline text={appInfo.headline} />
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
    flex-direction: column;
    align-items: center;
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
