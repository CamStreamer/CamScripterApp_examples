import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { DataSource } from './DataSource/DataSource';
import { DataOutput } from './DataOutput/DataOutput';

type TTab = 'source' | 'output';

export function Form() {
    const [openedTab, setOpenedTab] = useState<TTab>('source');

    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <Tabs value={openedTab} onChange={(e, v) => setOpenedTab(v)} centered>
                    <StyledTab label="Data Source" value={'source'} />
                    <StyledTab label="Data output" value={'output'} />
                </Tabs>
                <StyledBody>
                    {openedTab === 'source' && <DataSource />}
                    {openedTab === 'output' && <DataOutput />}
                </StyledBody>
            </StyledForm>
        </Fade>
    );
}

const StyledForm = styled('div')`
    width: 100%;
    flex: 1;
    display: flex;
    justify-content: center;
    flex-direction: column;
`;

const StyledTab = styled(Tab)`
    flex: 1;
    max-width: 100%;
    font-weight: bold;
`;

const StyledBody = styled('div')`
    width: 100%;
    flex: 1;
    background-color: white;
    padding: 20px;
`;
