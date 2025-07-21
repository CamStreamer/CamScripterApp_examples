type Props = {
    started: boolean;
    isStarting: boolean;
    isStopping: boolean;
};

export const useGetStatus = ({ started, isStarting, isStopping }: Props) => {
    const getStatus = () => {
        if (isStarting) {
            return 1;
        }
        if (isStopping) {
            return 3;
        }
        if (started) {
            return 2;
        }
        if (!started) {
            return 0;
        }
    };

    const getLabelText = () => {
        switch (getStatus()) {
            case 0: {
                return 'Stopped';
            }
            case 1: {
                return 'Starting...';
            }
            case 2: {
                return 'Running';
            }
            case 3: {
                return 'Stopping...';
            }
        }
    };

    const getChipClass = () => {
        switch (getStatus()) {
            case 0:
                return 'error';
            case 1:
            case 3:
                return 'default';
            case 2:
                return 'success';
        }
    };

    const getButtonText = () => {
        switch (started) {
            case true:
                return 'START';
            case false:
                return 'STOP';
        }
    };

    const shouldHideButton = getStatus() === 1 || getStatus() === 3;

    return [shouldHideButton, getLabelText, getChipClass, getButtonText] as const;
};
