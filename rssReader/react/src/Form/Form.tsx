import { styled } from '@mui/material/styles';

import { CameraConnectionSection } from './CameraConnectionSection';
import { RssFeedSection } from './RssFeedSection';
import { OutputSection } from './OutputSection';

export const Form = () => {
    return (
        <StyledFormRoot>
            <CameraConnectionSection />
            <RssFeedSection />
            <OutputSection />
        </StyledFormRoot>
    );
};

const StyledFormRoot = styled('div')`
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 24px;
`;

