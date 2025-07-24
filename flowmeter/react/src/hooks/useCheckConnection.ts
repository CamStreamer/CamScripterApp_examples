import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches } from '../utils';

type Props = {
    isFetching: boolean;
    isCameraResponding: boolean;
    areCredentialsValid: boolean;
};

export const useCheckConnection = ({ isFetching, isCameraResponding, areCredentialsValid }: Props) => {
    const { control } = useFormContext();
    const proxy: TWatches = {
        protocol: 'http',
        ip: useWatch({ control, name: `camera_ip` }),
        port: useWatch({ control, name: `camera_port` }),
        user: useWatch({ control, name: `camera_user` }),
        pass: useWatch({ control, name: `camera_pass` }),
    };

    const isDisabled = !proxy.protocol || !proxy.ip || !proxy.port || !proxy.user || !proxy.pass;

    const getStatus = () => {
        if (isDisabled) {
            return 0;
        }
        if (isFetching) {
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
                return 'Check';
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
