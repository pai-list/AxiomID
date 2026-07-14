/**
 * @jest-environment node
 */
import { axiomCatalog } from '@/lib/catalog';

describe('axiomCatalog', () => {
  it('should be defined and contain components and actions', () => {
    expect(axiomCatalog).toBeDefined();
    expect(axiomCatalog.components).toBeDefined();
    expect(axiomCatalog.actions).toBeDefined();
  });

  describe('Card component', () => {
    const cardSchema = axiomCatalog.components.Card.props;

    it('should validate correct card props', () => {
      const validProps1 = {
        title: 'Main Card',
        variant: 'plain' as const,
        animate: true,
      };
      const validProps2 = {
        title: 'Bento Card',
        variant: 'bento' as const,
      };
      const validProps3 = {};

      expect(cardSchema.safeParse(validProps1).success).toBe(true);
      expect(cardSchema.safeParse(validProps2).success).toBe(true);
      expect(cardSchema.safeParse(validProps3).success).toBe(true);
    });

    it('should reject invalid variant', () => {
      const invalidProps = {
        variant: 'invalid_variant',
      };
      const result = cardSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    it('should reject invalid animate type', () => {
      const invalidProps = {
        animate: 'yes',
      };
      const result = cardSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });
  });

  describe('LinkItem component', () => {
    const linkSchema = axiomCatalog.components.LinkItem.props;

    it('should validate correct link props', () => {
      const validProps = {
        label: 'Dashboard Link',
        href: '/dashboard',
        icon: 'fingerprint' as const,
        color: 'neon-green' as const,
      };
      expect(linkSchema.safeParse(validProps).success).toBe(true);
    });

    it('should require label', () => {
      const invalidProps = {
        href: '/dashboard',
      };
      const result = linkSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    it('should reject non-app internal href routes', () => {
      const invalidHrefs = [
        'https://google.com',
        '//double-slash',
        'dashboard',
        'ftp://test',
      ];

      invalidHrefs.forEach(href => {
        const result = linkSchema.safeParse({
          label: 'Test',
          href,
        });
        expect(result.success).toBe(false);
      });
    });

    it('should accept nested internal paths', () => {
      const validHrefs = [
        '/',
        '/dashboard/settings',
        '/passport/claim',
      ];

      validHrefs.forEach(href => {
        const result = linkSchema.safeParse({
          label: 'Test',
          href,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid icon and color enums', () => {
      const invalidIcon = {
        label: 'Test',
        href: '/test',
        icon: 'invalid-icon',
      };
      const invalidColor = {
        label: 'Test',
        href: '/test',
        color: 'invalid-color',
      };

      expect(linkSchema.safeParse(invalidIcon).success).toBe(false);
      expect(linkSchema.safeParse(invalidColor).success).toBe(false);
    });
  });

  describe('Heading component', () => {
    const headingSchema = axiomCatalog.components.Heading.props;

    it('should validate correct heading props', () => {
      const validProps = {
        text: 'AxiomID',
        level: 'h1' as const,
      };
      expect(headingSchema.safeParse(validProps).success).toBe(true);
    });

    it('should require text', () => {
      const result = headingSchema.safeParse({ level: 'h1' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid level', () => {
      const result = headingSchema.safeParse({ text: 'AxiomID', level: 'h4' });
      expect(result.success).toBe(false);
    });
  });

  describe('Button component', () => {
    const buttonSchema = axiomCatalog.components.Button.props;

    it('should validate correct button props', () => {
      const validProps = {
        label: 'Click Me',
        action: 'refresh_data',
      };
      expect(buttonSchema.safeParse(validProps).success).toBe(true);
    });

    it('should require label', () => {
      const result = buttonSchema.safeParse({ action: 'refresh_data' });
      expect(result.success).toBe(false);
    });
  });

  describe('Metric component', () => {
    const metricSchema = axiomCatalog.components.Metric.props;

    it('should validate correct metric props', () => {
      const validProps = {
        label: 'Total Users',
        value: '10,240',
      };
      expect(metricSchema.safeParse(validProps).success).toBe(true);
    });

    it('should require both label and value', () => {
      const result1 = metricSchema.safeParse({ label: 'Total Users' });
      const result2 = metricSchema.safeParse({ value: '10,240' });
      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });
  });

  describe('actions configuration', () => {
    it('should define refresh_data action', () => {
      expect(axiomCatalog.actions.refresh_data).toBeDefined();
      expect(axiomCatalog.actions.refresh_data.description).toBe('Refresh dashboard data');
    });
  });
});
