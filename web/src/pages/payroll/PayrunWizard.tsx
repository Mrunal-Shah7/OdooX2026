import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Field } from '../../components/ui/Field';
import { Select } from '../../components/ui/Select';

export function PayrunWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  return (
    <>
      <Button variant="accent" onClick={() => { setOpen(true); setStep(1); }}>
        New pay run
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={step === 1 ? 'New pay run — Step 1' : 'New pay run — Step 2'}
        footer={
          <>
            {step === 2 ? (
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            ) : null}
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={() => (step === 1 ? setStep(2) : setOpen(false))}>
              {step === 1 ? 'Next' : 'Create pay run'}
            </Button>
          </>
        }
      >
        {step === 1 ? (
          <div className="space-y-4">
            <Field label="Structure">
              <Select options={[{ value: 'regular', label: 'Regular Salary' }]} value="regular" />
            </Field>
            <Field label="Period">
              <Select options={[{ value: '2026-10', label: 'October 2026' }]} value="2026-10" />
            </Field>
          </div>
        ) : (
          <p className="m-0 text-body-sm text-text-muted">38 eligible employees selected for Regular Salary.</p>
        )}
      </Modal>
    </>
  );
}
