import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches } from '../utils';

type Props = {
    isFetchingConnection: boolean;
    isCameraResponding: boolean;
    areCredentialsValid: boolean;
    name: 'camera' | 'acs' | 'event_camera';
};

export const useCheckConnection = ({ isFetchingConnection, isCameraResponding, areCredentialsValid, name }: Props) => {
    const { control } = useFormContext();

    const proxy: TWatches = {
        protocol: useWatch({ control, name: `${name}_protocol` }),
        ip: useWatch({ control, name: `${name}_ip` }),
        port: useWatch({ control, name: `${name}_port` }),
        user: useWatch({ control, name: `${name}_user` }),
        pass: useWatch({ control, name: `${name}_pass` }),
    };

    const isDisabled = !proxy.user || !proxy.pass || !proxy.ip || !proxy.protocol || !proxy.port;

    const getStatus = () => {
        if (isDisabled) {
            return 0;
        }
        if (isFetchingConnection) {
            return 1;
        }
        if (isCameraResponding && areCredentialsValid) {
            return 2;
        } else {
            return 3;
        }
    };

    const getLabelText = () => {
        switch (getStatus()) {
            case 0: {
                return 'No credentials';
            }
            case 1: {
                return 'Checking...';
            }
            case 2: {
                return 'Successful';
            }
            case 3: {
                return 'Failed';
            }
            default: {
                return 'No credentials';
            }
        }
    };

    const getChipClass = () => {
        switch (getStatus()) {
            case 0:
            case 1:
                return 'default';
            case 2:
                return 'success';
            case 3:
                return 'error';
        }
    };

    return [isDisabled, getLabelText, getChipClass] as const;
};
