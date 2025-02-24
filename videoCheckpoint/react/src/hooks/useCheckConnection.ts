import { useFormContext, useWatch } from 'react-hook-form';
import { TWatches, TGenetec } from '../utils';

type Props = {
    isFetching: boolean;
    isCameraResponding: boolean;
    areCredentialsValid: boolean;
    name: 'camera' | 'conn_hub' | 'output_camera' | 'genetec';
};

export const useCheckConnection = ({ isFetching, isCameraResponding, areCredentialsValid, name }: Props) => {
    const { control } = useFormContext();
    const baseProxy: TWatches = {
        protocol: useWatch({ control, name: `${name}.protocol` }),
        ip: useWatch({ control, name: `${name}.ip` }),
        port: useWatch({ control, name: `${name}.port` }),
        user: useWatch({ control, name: `${name}.user` }),
        pass: useWatch({ control, name: `${name}.pass` }),
    };
    let proxy: TWatches | TGenetec = baseProxy;
    let isDisabled: boolean;

    if (name === 'genetec') {
        proxy = {
            ...baseProxy,
            base_uri: useWatch({ control, name: `${name}.base_uri` }),
            app_id: useWatch({ control, name: `${name}.app_id` }),
        };
        isDisabled =
            !proxy.protocol ||
            !proxy.ip ||
            !proxy.port ||
            !proxy.user ||
            !proxy.pass ||
            !proxy.base_uri ||
            !proxy.app_id;
    } else {
        isDisabled = !proxy.protocol || !proxy.ip || !proxy.port || !proxy.user || !proxy.pass;
    }

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
