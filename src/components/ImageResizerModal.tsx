import React, { useState, useEffect } from 'react';
import { Modal, InputNumber, Select, Checkbox, Tooltip, Form, Button } from 'antd';
import type { ImageDataResizeOptions } from '../utils/imageResize';

const { Option } = Select;

interface Props {
  visible: boolean;
  onClose: () => void;
  onResize: (options: ImageDataResizeOptions) => void;
  originalWidth: number;
  originalHeight: number;
}

const ImageResizerModal: React.FC<Props> = ({ visible, onClose, onResize, originalWidth, originalHeight }) => {
  const [form] = Form.useForm();
  const [linked, setLinked] = useState(true);
  const [unit, setUnit] = useState<'px' | '%'>('px');
  const [algoDesc, setAlgoDesc] = useState('');

  const aspectRatio = originalWidth / originalHeight;

  const algorithmDescriptions: Record<string, string> = {
    'nearest': 'Быстрая, но может выглядеть пикселизированной. Хорошо подходит для пиксель-арта.',
    'bilinear': 'Более гладкое изображение. Хороший общий вариант.',
  };

  useEffect(() => {
    const currentAlgo = form.getFieldValue('algorithm') || 'bilinear';
    setAlgoDesc(algorithmDescriptions[currentAlgo]);
  }, [form]);

  const handleValuesChange = (changed: any, all: any) => {
    if (linked && ('width' in changed || 'height' in changed)) {
      const field = 'width' in changed ? 'width' : 'height';
      const val = changed[field];

      if (field === 'width') {
        form.setFieldsValue({ height: unit === 'px' ? Math.round(val / aspectRatio) : val });
      } else {
        form.setFieldsValue({ width: unit === 'px' ? Math.round(val * aspectRatio) : val });
      }
    }
  };

  const handleFinish = (values: any) => {
    let width = values.width;
    let height = values.height;

    if (unit === '%') {
      width = Math.round(originalWidth * (width / 100));
      height = Math.round(originalHeight * (height / 100));
    }

    if (width < 1 || height < 1 || width > 10000 || height > 10000) {
      return;
    }

    onResize({
      width,
      height,
      algorithm: values.algorithm,
    });

    onClose();
  };

  const megapixels = (w: number, h: number) => ((w * h) / 1_000_000).toFixed(2);

  return (
    <Modal title="Изменение масштаба изображения" open={visible} onCancel={onClose} footer={null}>
      <div style={{ marginBottom: 12 }}>
        <b>До:</b> {originalWidth} × {originalHeight} = {megapixels(originalWidth, originalHeight)} Мп <br />
        <b>После:</b>{' '}
        <Form form={form} layout="inline" onValuesChange={handleValuesChange} onFinish={handleFinish} initialValues={{
          width: unit === '%' ? 100 : originalWidth,
          height: unit === '%' ? 100 : originalHeight,
          algorithm: 'bilinear',
        }}>
          <Select value={unit} onChange={val => setUnit(val)} style={{ width: 100 }}>
            <Option value="px">Пиксели</Option>
            <Option value="%">Проценты</Option>
          </Select>
          <Form.Item name="width" rules={[{ required: true, type: 'number', min: 1, max: 10000 }]}>
            <InputNumber addonBefore="Ширина" />
          </Form.Item>
          <Form.Item name="height" rules={[{ required: true, type: 'number', min: 1, max: 10000 }]}>
            <InputNumber addonBefore="Высота" />
          </Form.Item>
          <Checkbox checked={linked} onChange={e => setLinked(e.target.checked)}>
            Сохранять пропорции
          </Checkbox>
          <Form.Item name="algorithm">
            <Select onChange={(val) => setAlgoDesc(algorithmDescriptions[val])}>
              <Option value="nearest">Ближайший сосед</Option>
              <Option value="bilinear">Билинейная</Option>
            </Select>
          </Form.Item>
          <Tooltip title={algoDesc}>
            <span style={{ cursor: 'help', textDecoration: 'underline' }}>Описание алгоритма</span>
          </Tooltip>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Применить
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ImageResizerModal;
