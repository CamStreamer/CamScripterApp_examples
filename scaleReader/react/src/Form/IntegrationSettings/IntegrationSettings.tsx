import { StyledRow } from './../../components/FormInputs';
import { IntegrationDeviceSettings } from './IntegrationDeviceSettings';
import { WidgetSettings } from './WidgetSettings';

export const IntegrationSettings = () => {
    return (
        <StyledRow>
            <IntegrationDeviceSettings />
            <WidgetSettings />
        </StyledRow>
    );
};
