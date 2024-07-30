import { Control } from 'react-hook-form';

import Fade from '@mui/material/Fade';
import styled from '@mui/material/styles/styled';
import { TServerData } from '../models/schema';
import { Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { LuxMeterSettings } from './LuxmeterSettings';
import { DataProcess } from './CameraSettings';
import { WidgetSettings } from './WidgetSettings';

type Props = {
    control: Control<TServerData>;
};

type TTab = 'luxmeter' | 'cameras' | 'widget';

export function Form({ control }: Props) {
    const [openedTab, setOpenedTab] = useState<TTab>('luxmeter');

    return (
        <Fade in={true} timeout={1000}>
            <StyledForm>
                <Tabs value={openedTab} onChange={(e, v) => setOpenedTab(v)} centered>
                    <StyledTab label="Luxmeter settings" value={'luxmeter'} />
                    <StyledTab label="Camera settings" value={'cameras'} />
                    <StyledTab label="Widget settings" value={'widget'} />
                </Tabs>
                <StyledBody>
                    {openedTab === 'luxmeter' && <LuxMeterSettings control={control} />}
                    {openedTab === 'cameras' && <DataProcess control={control} />}
                    {openedTab === 'widget' && <WidgetSettings control={control} />}
                </StyledBody>
            </StyledForm>
        </Fade>
    );
}

const StyledForm = styled('div')({
    width: '100%',
    flex: '1',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
});

const StyledTab = styled(Tab)({
    flex: '1',
});

const StyledBody = styled('div')({
    width: '100%',
    flex: '1',
    backgroundColor: 'white',
    padding: '20px',
});
