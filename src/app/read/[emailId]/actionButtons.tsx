import React from 'react';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';
import summeryAction from './summeryAction';
import linkAction from './linkAction';

interface Item {
  ai_fullsummary: boolean;
  ai_links: boolean;
  html_body: string;
  id: string;
}

const ButtonActions = ({ item }: { item: Item }) => {
  return (
    <div className="items-center flex gap-2">
      {!item.ai_fullsummary && (
        <form>
          <Input
            className="hidden"
            value={item.html_body}
            name="emailText"
            readOnly
          />
          <Input
            className="hidden"
            value={item.id}
            name="emailId"
            readOnly
          />
          <SubmitButton
            pendingText="Generating..."
            formAction={summeryAction}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Generate Full Summary
          </SubmitButton>
        </form>
      )}
      
      {!item.ai_links && (
        <form>
          <Input
            className="hidden"
            value={item.html_body}
            name="emailText"
            readOnly
          />
          <Input
            className="hidden"
            value={item.id}
            name="emailId"
            readOnly
          />
          <SubmitButton
            pendingText="Generating..."
            formAction={linkAction}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Find Interesting Links
          </SubmitButton>
        </form>
      )}
    </div>
  );
};

export default ButtonActions;